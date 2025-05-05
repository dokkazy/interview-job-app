"use client";

import { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Job } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { LoadingSpinner } from "@/components/loading-spinner";

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchJobs() {
      try {
        const jobsSnapshot = await getDocs(collection(db, "jobs"));
        const jobsData: Job[] = [];
        jobsSnapshot.forEach((doc) => {
          const data = doc.data();
          let postedAt: Date | undefined = undefined;
          if (data.postedAt) {
            if (typeof data.postedAt.toDate === "function") {
              postedAt = data.postedAt.toDate();
            } else if (typeof data.postedAt === "string" || typeof data.postedAt === "number") {
              postedAt = new Date(data.postedAt);
            }
          }
          jobsData.push({
            id: doc.id,
            ...data,
            postedAt,
          } as Job);
        });
        setJobs(jobsData);
      } catch (error) {
        console.error("Error fetching jobs:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchJobs();
  }, []);

  const openJobs = jobs.filter((job) => job.status !== "closed");

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">All Jobs</h1>
      {loading ? (
        <div className="flex justify-center py-10">
          <LoadingSpinner />
        </div>
      ) : openJobs.length === 0 ? (
        <div className="text-center text-muted-foreground py-10">No open jobs found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {openJobs.map((job) => (
            <Card key={job.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {job.title}
                  <Badge variant={job.status === "active" ? "default" : "outline"}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-2 text-muted-foreground">{job.companyName}</div>
                <div className="mb-2">{job.location}</div>
                <div className="mb-2 text-xs text-muted-foreground">
                  Posted {job.postedAt ? formatDistanceToNow(job.postedAt, { addSuffix: true }) : "Unknown"}
                </div>
                <Button asChild variant="outline" className="mt-2 w-full">
                  <Link href={`/jobs/${job.id}`}>View Job</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 