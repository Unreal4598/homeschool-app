import { Document, Page, View, Text } from '@react-pdf/renderer'
import { styles, PdfHeader, PdfFooter, formatMinutes, formatDate } from './shared'

interface ActivityRow {
  entryDate: string
  subjectName: string
  allocatedMinutes: number
  location: string
  notes: string | null
}

interface ActivityLogData {
  familyName: string
  studentName: string
  schoolYear: string
  entries: ActivityRow[]
}

export function ActivityLogPdf({ data }: { data: ActivityLogData }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PdfHeader
          title="Activity Log"
          familyName={data.familyName}
          studentName={data.studentName}
          schoolYear={data.schoolYear}
        />

        <Text style={[styles.cellMuted, { marginBottom: 8 }]}>
          {data.entries.length} {data.entries.length === 1 ? 'entry' : 'entries'} recorded
        </Text>

        <View style={styles.headerRow}>
          <Text style={[styles.cell, styles.bold, { width: 70 }]}>Date</Text>
          <Text style={[styles.cell, styles.bold, { flex: 2 }]}>Subject</Text>
          <Text style={[styles.cell, styles.bold, { width: 45, textAlign: 'right' }]}>Time</Text>
          <Text style={[styles.cell, styles.bold, { width: 55, textAlign: 'center' }]}>Location</Text>
          <Text style={[styles.cell, styles.bold, { flex: 3, paddingLeft: 8 }]}>Notes</Text>
        </View>

        {data.entries.map((e, i) => (
          <View key={i} style={styles.row} wrap={false}>
            <Text style={[styles.cell, { width: 70 }]}>{formatDate(e.entryDate)}</Text>
            <Text style={[styles.cell, { flex: 2 }]}>{e.subjectName}</Text>
            <Text style={[styles.cell, { width: 45, textAlign: 'right' }]}>
              {formatMinutes(e.allocatedMinutes)}
            </Text>
            <Text style={[styles.cellMuted, { width: 55, textAlign: 'center' }]}>
              {e.location === 'home' ? 'At Home' : 'Off-Site'}
            </Text>
            <Text style={[styles.cellMuted, { flex: 3, paddingLeft: 8 }]}>
              {e.notes ?? ''}
            </Text>
          </View>
        ))}

        {data.entries.length === 0 && (
          <Text style={[styles.cellMuted, { marginTop: 12 }]}>No entries recorded this school year.</Text>
        )}

        <PdfFooter />
      </Page>
    </Document>
  )
}
