import { StyleSheet, View, Text } from '@react-pdf/renderer'

export const colors = {
  primary: '#2563eb',
  text: '#111827',
  muted: '#6b7280',
  border: '#e5e7eb',
  bg: '#f9fafb',
  green: '#16a34a',
}

export const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontSize: 9,
    fontFamily: 'Helvetica',
    color: colors.text,
  },
  pageTitle: {
    fontSize: 16,
    fontFamily: 'Helvetica-Bold',
    color: colors.primary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 9,
    color: colors.muted,
    marginBottom: 16,
  },
  divider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Helvetica-Bold',
    marginBottom: 6,
    marginTop: 16,
  },
  row: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    paddingVertical: 5,
    borderBottomWidth: 1,
    borderBottomColor: colors.text,
    marginBottom: 2,
  },
  cell: {
    fontSize: 9,
    color: colors.text,
  },
  cellMuted: {
    fontSize: 9,
    color: colors.muted,
  },
  bold: {
    fontFamily: 'Helvetica-Bold',
  },
  footer: {
    position: 'absolute',
    bottom: 24,
    left: 48,
    right: 48,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
})

export function PdfHeader({
  title,
  familyName,
  studentName,
  schoolYear,
}: {
  title: string
  familyName: string
  studentName: string
  schoolYear: string
}) {
  const generated = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
  return (
    <View>
      <Text style={styles.pageTitle}>{title}</Text>
      <Text style={styles.subtitle}>
        {familyName} · {studentName} · School Year {schoolYear} · Generated {generated}
      </Text>
      <View style={styles.divider} />
    </View>
  )
}

export function PdfFooter() {
  return (
    <View style={styles.footer} fixed>
      <Text style={{ fontSize: 8, color: colors.muted }}>
        Homeschool Tracker — Missouri RSMo 167.012
      </Text>
      <Text
        style={{ fontSize: 8, color: colors.muted }}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  )
}

export function formatMinutes(total: number) {
  const h = Math.floor(total / 60)
  const m = total % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}
