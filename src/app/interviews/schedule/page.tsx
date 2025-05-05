"use client"

import type React from "react"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import { doc, getDoc, addDoc, collection, Timestamp } from "firebase/firestore"
import { db } from "@/lib/firebase"
import type { Application, Job, User as UserType } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ArrowLeft, Calendar, Building } from "lucide-react"
import Link from "next/link"
import { format } from "date-fns"
import { toast } from "sonner"

export default function ScheduleInterviewPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const applicationId = searchParams.get("applicationId")
  const { user, loading: authLoading } = useAuth()

  const [application, setApplication] = useState<Application | null>(null)
  const [job, setJob] = useState<Job | null>(null)
  const [applicant, setApplicant] = useState<UserType | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)

  const [formData, setFormData] = useState({
    date: format(new Date(), "yyyy-MM-dd"),
    time: "10:00",
    duration: "30",
    interviewType: "video",
    notes: "",
  })

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login")
    }
  }, [user, authLoading, router])

  useEffect(() => {
    async function fetchApplicationDetails() {
      if (!user || !applicationId) return

      try {
        // Get application details
        const applicationDoc = await getDoc(doc(db, "applications", applicationId))

        if (!applicationDoc.exists()) {
          toast.warning("The application you're looking for doesn't exist")
          router.push("/dashboard")
          return
        }

        const applicationData = {
          id: applicationDoc.id,
          ...applicationDoc.data(),
        } as Application

        setApplication(applicationData)

        // Get job details
        const jobDoc = await getDoc(doc(db, "jobs", applicationData.jobId))

        if (jobDoc.exists()) {
          setJob({
            id: jobDoc.id,
            ...jobDoc.data(),
          } as Job)
        }

        // Get applicant details
        const applicantDoc = await getDoc(doc(db, "users", applicationData.applicantId))

        if (applicantDoc.exists()) {
          setApplicant({
            id: applicantDoc.id,
            ...applicantDoc.data(),
          } as UserType)
        }
      } catch (error) {
        console.error("Error fetching application details:", error)
        toast.error("There was a problem loading the application details. Please try again later.")
      } finally {
        setLoading(false)
      }
    }

    if (user && applicationId) {
      fetchApplicationDetails()
    } else {
      setLoading(false)
    }
  }, [applicationId, user, router])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user || !application || !job || !applicant) return

    setSubmitting(true)
    try {
      let meetingUrl: string | undefined = undefined
      if (formData.interviewType === "video") {
        // Call the API route to create Stream call
        const res = await fetch("/api/create-stream-call", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recruiterId: user.id,
            applicantId: applicant.id,
            scheduledAt: `${formData.date}T${formData.time}`,
            duration: Number(formData.duration),
            interviewType: formData.interviewType,
          }),
        })
        if (!res.ok) throw new Error("Failed to create Stream call")
        const data = await res.json()
        meetingUrl = data.callId
      }
      // Store interview in Firestore
      await addDoc(collection(db, "interviews"), {
        applicationId: application.id,
        jobId: job.id,
        recruiterId: user.id,
        applicantId: applicant.id,
        scheduledAt: Timestamp.fromDate(new Date(`${formData.date}T${formData.time}`)),
        duration: Number(formData.duration),
        status: "scheduled",
        meetingUrl,
        notes: formData.notes,
        interviewType: formData.interviewType
      })
      toast.success("Interview scheduled successfully!")
      router.push("/interviews")
    } catch (error) {
      console.error("Error scheduling interview:", error)
      toast.error("Failed to schedule interview. Please try again.")
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || loading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return null
  }

  if (!application && applicationId) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-muted-foreground">Application not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-2 mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/interviews">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Interviews
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-6">Schedule Interview</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Interview Details</CardTitle>
              <CardDescription>Schedule a video interview with the applicant</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    min={format(new Date(), "yyyy-MM-dd")}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="time">Time</Label>
                  <Input id="time" name="time" type="time" value={formData.time} onChange={handleChange} required />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes)</Label>
                  <Select value={formData.duration} onValueChange={(value) => handleSelectChange("duration", value)}>
                    <SelectTrigger id="duration">
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="45">45 minutes</SelectItem>
                      <SelectItem value="60">60 minutes</SelectItem>
                      <SelectItem value="90">90 minutes</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="interviewType">Interview Type</Label>
                  <Select value={formData.interviewType} onValueChange={(value) => handleSelectChange("interviewType", value)}>
                    <SelectTrigger id="interviewType">
                      <SelectValue placeholder="Select interview type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="in-person">In-Person</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <textarea
                    id="notes"
                    name="notes"
                    className="w-full border rounded p-2 min-h-[80px]"
                    value={formData.notes}
                    onChange={handleChange}
                    placeholder="Add any notes for the interview (optional)"
                  />
                </div>

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? (
                    <>
                      <LoadingSpinner  />
                      Scheduling...
                    </>
                  ) : (
                    <>
                      <Calendar className="mr-2 h-4 w-4" />
                      Schedule Interview
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          {job && (
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">{job.title}</h3>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Building className="h-4 w-4" />
                      <span>{job.companyName}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {applicant && (
            <Card>
              <CardHeader>
                <CardTitle>Applicant Details</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">{applicant.displayName}</h3>
                    {applicant.profile?.headline && (
                      <p className="text-muted-foreground">{applicant.profile.headline}</p>
                    )}
                  </div>

                  <Button variant="outline" size="sm" asChild className="w-full">
                    <a href={application?.resumeUrl} target="_blank" rel="noopener noreferrer">
                      View Resume
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
