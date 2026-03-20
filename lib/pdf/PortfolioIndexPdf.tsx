import { Document, Page, View, Text } from '@react-pdf/renderer'
import { styles, PdfHeader, PdfFooter, formatDate } from './shared'

interface PortfolioRow {
  fileName: string
  uploadDate: string
  mimeType: string | null
  fileSize: number | null
  notes: string | null
}

interface PortfolioIndexData {
  familyName: string
  studentName: string
  schoolYear: string
  files: PortfolioRow[]
}

function formatBytes(bytes: number | null) {
  if (!bytes) return ''
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function fileTypeLabel(mimeType: string | null) {
  if (!mimeType) return 'File'
  if (mimeType.startsWith('image/')) return 'Image'
  if (mimeType === 'application/pdf') return 'PDF'
  if (mimeType.includes('word')) return 'Word'
  return 'File'
}

export function PortfolioIndexPdf({ data }: { data: PortfolioIndexData }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <PdfHeader
          title="Portfolio Index"
          familyName={data.familyName}
          studentName={data.studentName}
          schoolYear={data.schoolYear}
        />

        <Text style={[styles.cellMuted, { marginBottom: 8 }]}>
          {data.files.length} {data.files.length === 1 ? 'file' : 'files'} in portfolio
        </Text>

        <View style={styles.headerRow}>
          <Text style={[styles.cell, styles.bold, { width: 80 }]}>Date</Text>
          <Text style={[styles.cell, styles.bold, { flex: 3 }]}>File Name</Text>
          <Text style={[styles.cell, styles.bold, { width: 40 }]}>Type</Text>
          <Text style={[styles.cell, styles.bold, { width: 50, textAlign: 'right' }]}>Size</Text>
          <Text style={[styles.cell, styles.bold, { flex: 2, paddingLeft: 8 }]}>Notes</Text>
        </View>

        {data.files.map((f, i) => (
          <View key={i} style={styles.row} wrap={false}>
            <Text style={[styles.cell, { width: 80 }]}>{formatDate(f.uploadDate)}</Text>
            <Text style={[styles.cell, { flex: 3 }]}>{f.fileName}</Text>
            <Text style={[styles.cellMuted, { width: 40 }]}>{fileTypeLabel(f.mimeType)}</Text>
            <Text style={[styles.cellMuted, { width: 50, textAlign: 'right' }]}>
              {formatBytes(f.fileSize)}
            </Text>
            <Text style={[styles.cellMuted, { flex: 2, paddingLeft: 8 }]}>{f.notes ?? ''}</Text>
          </View>
        ))}

        {data.files.length === 0 && (
          <Text style={[styles.cellMuted, { marginTop: 12 }]}>No files in portfolio.</Text>
        )}

        <PdfFooter />
      </Page>
    </Document>
  )
}
