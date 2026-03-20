import { Document, Page, View, Text } from '@react-pdf/renderer'
import { styles, colors, PdfHeader, PdfFooter, formatMinutes } from './shared'

interface SubjectRow {
  name: string
  isCore: boolean
  totalMinutes: number
}

interface AnnualSummaryData {
  familyName: string
  studentName: string
  schoolYear: string
  totalMinutes: number
  coreMinutes: number
  atHomeCoreMinutes: number
  subjectRows: SubjectRow[]
}

const TARGETS = { total: 60000, core: 36000, atHomeCore: 24000 } // minutes

function ProgressRow({
  label,
  minutes,
  targetMinutes,
  targetLabel,
}: {
  label: string
  minutes: number
  targetMinutes: number
  targetLabel: string
}) {
  const pct = Math.min(100, Math.round((minutes / targetMinutes) * 100))
  const met = pct >= 100
  return (
    <View style={{ marginBottom: 10 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <Text style={styles.cell}>{label}</Text>
        <Text style={[styles.cell, met ? { color: colors.green } : {}]}>
          {Math.floor(minutes / 60).toLocaleString()} / {targetLabel} hrs ({pct}%)
        </Text>
      </View>
      <View style={{ height: 6, backgroundColor: colors.border, borderRadius: 3 }}>
        <View
          style={{
            height: 6,
            width: `${pct}%`,
            backgroundColor: met ? colors.green : colors.primary,
            borderRadius: 3,
          }}
        />
      </View>
    </View>
  )
}

export function AnnualSummaryPdf({ data }: { data: AnnualSummaryData }) {
  const core = data.subjectRows.filter((s) => s.isCore)
  const nonCore = data.subjectRows.filter((s) => !s.isCore)

  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PdfHeader
          title="Annual Homeschool Summary"
          familyName={data.familyName}
          studentName={data.studentName}
          schoolYear={data.schoolYear}
        />

        <Text style={styles.sectionTitle}>Missouri Compliance (RSMo 167.012)</Text>
        <ProgressRow
          label="Total Hours"
          minutes={data.totalMinutes}
          targetMinutes={TARGETS.total}
          targetLabel="1,000"
        />
        <ProgressRow
          label="Core Subject Hours"
          minutes={data.coreMinutes}
          targetMinutes={TARGETS.core}
          targetLabel="600"
        />
        <ProgressRow
          label="At-Home Core Hours"
          minutes={data.atHomeCoreMinutes}
          targetMinutes={TARGETS.atHomeCore}
          targetLabel="400"
        />

        {core.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Core Subjects</Text>
            <View style={styles.headerRow}>
              <Text style={[styles.cell, styles.bold, { flex: 3 }]}>Subject</Text>
              <Text style={[styles.cell, styles.bold, { flex: 1, textAlign: 'right' }]}>Hours</Text>
            </View>
            {core.map((s) => (
              <View key={s.name} style={styles.row}>
                <Text style={[styles.cell, { flex: 3 }]}>{s.name}</Text>
                <Text style={[styles.cell, { flex: 1, textAlign: 'right' }]}>
                  {formatMinutes(s.totalMinutes)}
                </Text>
              </View>
            ))}
          </>
        )}

        {nonCore.length > 0 && (
          <>
            <Text style={styles.sectionTitle}>Non-Core Subjects</Text>
            <View style={styles.headerRow}>
              <Text style={[styles.cell, styles.bold, { flex: 3 }]}>Subject</Text>
              <Text style={[styles.cell, styles.bold, { flex: 1, textAlign: 'right' }]}>Hours</Text>
            </View>
            {nonCore.map((s) => (
              <View key={s.name} style={styles.row}>
                <Text style={[styles.cell, { flex: 3 }]}>{s.name}</Text>
                <Text style={[styles.cell, { flex: 1, textAlign: 'right' }]}>
                  {formatMinutes(s.totalMinutes)}
                </Text>
              </View>
            ))}
          </>
        )}

        <PdfFooter />
      </Page>
    </Document>
  )
}
