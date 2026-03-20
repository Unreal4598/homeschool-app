import { Document, Page, View, Text } from '@react-pdf/renderer'
import { styles, PdfHeader, PdfFooter, formatDate } from './shared'
import { EVAL_TYPES } from '@/lib/validations/evaluation'

interface EvaluationRow {
  evalDate: string
  evalType: string
  subjectName: string | null
  notes: string | null
  attachmentName: string | null
}

interface EvaluationReportData {
  familyName: string
  studentName: string
  schoolYear: string
  evalIntervalDays: number
  evaluations: EvaluationRow[]
}

function evalTypeLabel(value: string) {
  return EVAL_TYPES.find((t) => t.value === value)?.label ?? value
}

export function EvaluationReportPdf({ data }: { data: EvaluationReportData }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PdfHeader
          title="Evaluation History"
          familyName={data.familyName}
          studentName={data.studentName}
          schoolYear={data.schoolYear}
        />

        <Text style={[styles.cellMuted, { marginBottom: 8 }]}>
          Evaluation interval: every {data.evalIntervalDays} days ·{' '}
          {data.evaluations.length} {data.evaluations.length === 1 ? 'evaluation' : 'evaluations'} recorded
        </Text>

        <View style={styles.headerRow}>
          <Text style={[styles.cell, styles.bold, { width: 80 }]}>Date</Text>
          <Text style={[styles.cell, styles.bold, { flex: 2 }]}>Type</Text>
          <Text style={[styles.cell, styles.bold, { flex: 2 }]}>Subject</Text>
          <Text style={[styles.cell, styles.bold, { flex: 3 }]}>Notes</Text>
        </View>

        {data.evaluations.map((ev, i) => (
          <View key={i} style={styles.row} wrap={false}>
            <Text style={[styles.cell, { width: 80 }]}>{formatDate(ev.evalDate)}</Text>
            <Text style={[styles.cell, { flex: 2 }]}>{evalTypeLabel(ev.evalType)}</Text>
            <Text style={[styles.cellMuted, { flex: 2 }]}>{ev.subjectName ?? 'All subjects'}</Text>
            <View style={{ flex: 3 }}>
              <Text style={styles.cellMuted}>{ev.notes ?? ''}</Text>
              {ev.attachmentName && (
                <Text style={[styles.cellMuted, { marginTop: 2 }]}>
                  [attached] {ev.attachmentName}
                </Text>
              )}
            </View>
          </View>
        ))}

        {data.evaluations.length === 0 && (
          <Text style={[styles.cellMuted, { marginTop: 12 }]}>No evaluations recorded.</Text>
        )}

        <PdfFooter />
      </Page>
    </Document>
  )
}
