"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { JobSeekerDashboard } from "@/components/job-seeker-dashboard"
import { RecruiterDashboard } from "@/components/recruiter-dashboard"
import { LoadingSpinner } from "@/components/loading-spinner"

export default function Dashboard() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return null
  }

  return (
    <div className="container mx-auto py-10">
      {user.role === "job-seeker" ? <JobSeekerDashboard user={user} /> : <RecruiterDashboard user={user} />}
    </div>
  )
}
