"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/hooks/use-auth"
import {  serverTimestamp } from "firebase/firestore"
import type { Job } from "@/lib/types"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SkillsInput } from "@/components/skills-input"
import { LoadingSpinner } from "@/components/loading-spinner"
import { ArrowLeft, Save, Send } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

export default function NewJobPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()

  const [formData, setFormData] = useState<Partial<Job>>({
    title: "",
    companyName: "",
    description: "",
    location: "",
    locationType: "on-site",
    employmentType: "full-time",
    skills: [],
    salary: {
      min: 0,
      max: 0,
      currency: "USD",
    },
    status: "draft",
  })

  const [submitting, setSubmitting] = useState(false)

  if (authLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user || user.role !== "recruiter") {
    router.push("/login")
    return null
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSkillsChange = (skills: string[]) => {
    setFormData((prev) => ({ ...prev, skills }))
  }

  const handleSalaryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      salary: {
        ...prev.salary!,
        [name]: Number.parseInt(value) || 0,
      },
    }))
  }

  const handleSalaryCurrencyChange = (currency: string) => {
    setFormData((prev) => ({
      ...prev,
      salary: {
        ...prev.salary!,
        currency,
      },
    }))
  }

  const handleSubmit = async (status: "draft" | "active") => {
    if (!user) return

    setSubmitting(true)

    try {
      // Validate form
      if (status === "active") {
        if (!formData.title || !formData.description || !formData.location) {
          toast.error("Please fill in all required fields")
          setSubmitting(false)
          return
        }
      }

      // Create job document
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const jobData = {
        ...formData,
        recruiterId: user.id,
        postedAt: serverTimestamp(),
        status,
      }


      toast.success(status === "active" ? "Job posted successfully" : "Draft saved")

      router.push("/dashboard")
    } catch (error) {
      console.error("Error creating job:", error)
      toast.error("There was a problem creating the job. Please try again later.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center gap-2 mb-6">
        <Button asChild variant="ghost" size="sm">
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Jobs
          </Link>
        </Button>
      </div>

      <h1 className="text-3xl font-bold mb-6">Create New Job Listing</h1>

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Job Details</CardTitle>
            <CardDescription>Provide the basic information about the job</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Job Title *</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Senior Frontend Developer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name *</Label>
              <Input
                id="companyName"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
                placeholder="e.g., Acme Inc."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Job Description *</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe the job responsibilities, requirements, and benefits"
                rows={8}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Location & Type</CardTitle>
            <CardDescription>Specify the job location and employment type</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="location">Location *</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., New York, NY"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="locationType">Location Type</Label>
                <Select
                  value={formData.locationType}
                  onValueChange={(value) => handleSelectChange("locationType", value)}
                >
                  <SelectTrigger id="locationType">
                    <SelectValue placeholder="Select location type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="remote">Remote</SelectItem>
                    <SelectItem value="hybrid">Hybrid</SelectItem>
                    <SelectItem value="on-site">On-site</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type</Label>
                <Select
                  value={formData.employmentType}
                  onValueChange={(value) => handleSelectChange("employmentType", value)}
                >
                  <SelectTrigger id="employmentType">
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="full-time">Full-time</SelectItem>
                    <SelectItem value="part-time">Part-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                    <SelectItem value="internship">Internship</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Skills & Qualifications</CardTitle>
            <CardDescription>Add skills required for this position</CardDescription>
          </CardHeader>
          <CardContent>
            <SkillsInput value={formData.skills || []} onChange={handleSkillsChange} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Salary Information</CardTitle>
            <CardDescription>Provide salary range information (optional)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min">Minimum Salary</Label>
                <Input
                  id="min"
                  name="min"
                  type="number"
                  value={formData.salary?.min || ""}
                  onChange={handleSalaryChange}
                  placeholder="e.g., 50000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max">Maximum Salary</Label>
                <Input
                  id="max"
                  name="max"
                  type="number"
                  value={formData.salary?.max || ""}
                  onChange={handleSalaryChange}
                  placeholder="e.g., 80000"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select
                  value={formData.salary?.currency || "USD"}
                  onValueChange={(value) => handleSalaryCurrencyChange(value)}
                >
                  <SelectTrigger id="currency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                    <SelectItem value="CAD">CAD</SelectItem>
                    <SelectItem value="AUD">AUD</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => handleSubmit("draft")} disabled={submitting}>
            <Save className="mr-2 h-4 w-4" />
            Save as Draft
          </Button>
          <Button onClick={() => handleSubmit("active")} disabled={submitting}>
            {submitting ? (
              <>
                <LoadingSpinner />
                Submitting...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                Publish Job
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
