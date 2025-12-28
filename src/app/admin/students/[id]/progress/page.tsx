
import StudentProgressContent from './StudentProgressContent'

export default async function StudentProgressPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    return <StudentProgressContent studentId={id} />
}
