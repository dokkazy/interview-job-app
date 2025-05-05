"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { doc, getDoc } from "firebase/firestore"
import { db } from "@/lib/firebase"
import { useAuth } from "@/hooks/use-auth"
import type { Job } from "@/lib/types"
import { LoadingSpinner } from "@/components/loading-spinner"
import { JobSeekerView } from "@/components/sections/job-detail/job-seeker-view"
import { RecruiterView } from "@/components/sections/job-detail/recruiter-view"
import { toDate } from "@/lib/utils"
import { toast } from "sonner"

export default function JobDetailPage() {
  const { id } = useParams()
  const { user, loading: authLoading } = useAuth()

  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const [isOwner, setIsOwner] = useState(false)

  useEffect(() => {
    async function fetchJobDetails() {
      try {
        if (!id) return

        const jobDoc = await getDoc(doc(db, "jobs", id as string))

        if (!jobDoc.exists()) {
          toast.warning("The job you're looking for doesn't exist or has been removed.")
          return
        }

        const jobData = {
          id: jobDoc.id,
          ...jobDoc.data(),
          postedAt: toDate(jobDoc.data().postedAt),
        } as Job

        setJob(jobData)

        // Check if current user is the job owner
        if (user && user.id === jobData.recruiterId) {
          setIsOwner(true)
        }

        // Check if user has already applied (for job seekers)
        if (user && user.role === "job-seeker") {
          // This will be implemented in the JobSeekerView component
        }
      } catch (error) {
        console.error("Error fetching job details:", error)
        toast.error("There was a problem loading the job details. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      fetchJobDetails()
    }
  }, [id, user, authLoading])

  if (authLoading || loading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
          <p className="text-muted-foreground">The job you&apos;re looking for doesn&apos;t exist or has been removed.</p>
        </div>
      </div>
    )
  }

  // Render different views based on user role and ownership
  if (isOwner) {
    return <RecruiterView job={job} />
  }

  return <JobSeekerView job={job} user={user} />
}
