import { NextRequest, NextResponse } from 'next/server'
import { renderToBuffer, type DocumentProps } from '@react-pdf/renderer'
import { createElement, type ReactElement } from 'react'
import { createClient } from '@/lib/supabase/server'
import { db } from '@/lib/db'
import { getSchoolYear, calculateCompliance } from '@/lib/compliance'
import { AnnualSummaryPdf } from '@/lib/pdf/AnnualSummaryPdf'
import { ActivityLogPdf } from '@/lib/pdf/ActivityLogPdf'
import { EvaluationReportPdf } from '@/lib/pdf/EvaluationReportPdf'
import { PortfolioIndexPdf } from '@/lib/pdf/PortfolioIndexPdf'

const VALID_TYPES = ['annual_summary', 'activity_log', 'evaluation_report', 'portfolio_index']

function safeFilename(name: string) {
  // Replace any non-ASCII characters (e.g. em dash in "2025–26") with hyphens
  return name.replace(/[^\x20-\x7E]/g, '-')
}

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const type = searchParams.get('type')
  const studentId = searchParams.get('studentId')
  const schoolYearParam = searchParams.get('schoolYear') // e.g. "2024-25"

  if (!type || !VALID_TYPES.includes(type)) {
    return new NextResponse('Invalid report type', { status: 400 })
  }
  if (!studentId) {
    return new NextResponse('Missing studentId', { status: 400 })
  }

  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return new NextResponse('Unauthorized', { status: 401 })

  const membership = await db.familyMembership.findFirst({
    where: { userId: user.id },
    include: { family: { select: { name: true, evalIntervalDays: true } } },
  })
  if (!membership) return new NextResponse('No family', { status: 403 })

  const student = await db.student.findFirst({
    where: { id: studentId, familyId: membership.familyId },
    select: { id: true, firstName: true, lastName: true },
  })
  if (!student) return new NextResponse('Student not found', { status: 404 })

  // Determine school year date range
  const schoolYear = getSchoolYear(new Date())
  const syLabel = schoolYearParam ?? schoolYear.label
  const syStart = schoolYear.start
  const syEnd = schoolYear.end

  const familyName = membership.family.name
  const studentName = `${student.firstName} ${student.lastName}`

  let pdfElement
  let fileName

  if (type === 'annual_summary') {
    const allocations = await db.entryStudentAllocation.findMany({
      where: {
        studentId,
        entry: { entryDate: { gte: syStart, lte: syEnd }, deletedAt: null },
      },
      include: {
        entry: { select: { location: true, subject: { select: { id: true, name: true, isCore: true } } } },
      },
    })

    const compliance = calculateCompliance(allocations)

    // Aggregate by subject
    const subjectMap = new Map<string, { name: string; isCore: boolean; totalMinutes: number }>()
    for (const a of allocations) {
      const { id, name, isCore } = a.entry.subject
      const existing = subjectMap.get(id)
      if (existing) {
        existing.totalMinutes += a.allocatedMinutes
      } else {
        subjectMap.set(id, { name, isCore, totalMinutes: a.allocatedMinutes })
      }
    }
    const subjectRows = Array.from(subjectMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    )

    pdfElement = createElement(AnnualSummaryPdf, {
      data: {
        familyName,
        studentName,
        schoolYear: syLabel,
        totalMinutes: compliance.totalMinutes,
        coreMinutes: compliance.coreMinutes,
        atHomeCoreMinutes: compliance.atHomeCoreMinutes,
        subjectRows,
      },
    })
    fileName = safeFilename(`${student.firstName}-annual-summary-${syLabel}.pdf`)
  } else if (type === 'activity_log') {
    const allocations = await db.entryStudentAllocation.findMany({
      where: {
        studentId,
        entry: { entryDate: { gte: syStart, lte: syEnd }, deletedAt: null },
      },
      include: {
        entry: {
          select: {
            entryDate: true,
            location: true,
            notes: true,
            subject: { select: { name: true } },
          },
        },
      },
      orderBy: { entry: { entryDate: 'asc' } },
    })

    pdfElement = createElement(ActivityLogPdf, {
      data: {
        familyName,
        studentName,
        schoolYear: syLabel,
        entries: allocations.map((a) => ({
          entryDate: a.entry.entryDate.toISOString().split('T')[0],
          subjectName: a.entry.subject.name,
          allocatedMinutes: a.allocatedMinutes,
          location: a.entry.location,
          notes: a.entry.notes,
        })),
      },
    })
    fileName = safeFilename(`${student.firstName}-activity-log-${syLabel}.pdf`)
  } else if (type === 'evaluation_report') {
    const evaluations = await db.progressEvaluation.findMany({
      where: { studentId, familyId: membership.familyId },
      orderBy: { evalDate: 'asc' },
      select: {
        evalDate: true,
        evalType: true,
        notes: true,
        subject: { select: { name: true } },
        attachment: { select: { fileName: true } },
      },
    })

    pdfElement = createElement(EvaluationReportPdf, {
      data: {
        familyName,
        studentName,
        schoolYear: syLabel,
        evalIntervalDays: membership.family.evalIntervalDays,
        evaluations: evaluations.map((ev) => ({
          evalDate: ev.evalDate.toISOString().split('T')[0],
          evalType: ev.evalType,
          subjectName: ev.subject?.name ?? null,
          notes: ev.notes,
          attachmentName: ev.attachment?.fileName ?? null,
        })),
      },
    })
    fileName = safeFilename(`${student.firstName}-evaluations-${syLabel}.pdf`)
  } else {
    // portfolio_index
    const attachments = await db.attachment.findMany({
      where: { studentId, familyId: membership.familyId },
      orderBy: { uploadDate: 'asc' },
      select: {
        fileName: true,
        uploadDate: true,
        mimeType: true,
        fileSize: true,
        notes: true,
      },
    })

    pdfElement = createElement(PortfolioIndexPdf, {
      data: {
        familyName,
        studentName,
        schoolYear: syLabel,
        files: attachments.map((a) => ({
          fileName: a.fileName,
          uploadDate: a.uploadDate.toISOString().split('T')[0],
          mimeType: a.mimeType,
          fileSize: a.fileSize != null ? Number(a.fileSize) : null,
          notes: a.notes,
        })),
      },
    })
    fileName = safeFilename(`${student.firstName}-portfolio-${syLabel}.pdf`)
  }

  const buffer = await renderToBuffer(pdfElement as ReactElement<DocumentProps>)

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}
