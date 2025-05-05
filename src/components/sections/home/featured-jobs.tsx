"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, limit } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Job } from "@/lib/types";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Building, MapPin, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { LoadingSpinner } from "@/components/loading-spinner";
import { toDate } from "@/lib/utils";
import { toast } from "sonner";

export function FeaturedJobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function fetchFeaturedJobs() {
      try {
        // Query for active jobs with a limit to avoid loading too many
        const jobsQuery = query(
          collection(db, "jobs"),
          where("status", "==", "active"),
          limit(10) // Limit to 10 jobs to avoid loading too many
        );

        const jobsSnapshot = await getDocs(jobsQuery);
        const jobsData: Job[] = [];

        jobsSnapshot.forEach((doc) => {
          jobsData.push({
            id: doc.id,
            ...doc.data(),
          } as Job);
        });

        // Sort jobs by postedAt date in JavaScript
        const sortedJobs = jobsData.sort((a, b) => {
          const dateA = toDate(a.postedAt);
          const dateB = toDate(b.postedAt);
          return dateB.getTime() - dateA.getTime(); // Sort in descending order (newest first)
        });

        // Take only the first 4 jobs after sorting
        setJobs(sortedJobs.slice(0, 4));
      } catch (error) {
        console.error("Error fetching featured jobs:", error);
        toast.error(
          "There was a problem loading featured jobs. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    }

    fetchFeaturedJobs();
  }, []);

  return (
    <section className="my-16">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold mb-2">Featured Jobs</h2>
          <p className="text-muted-foreground">
            Explore the latest opportunities
          </p>
        </div>
        <Button asChild variant="outline" className="mt-4 md:mt-0">
          <Link href="/jobs">
            View All Jobs
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <LoadingSpinner />
        </div>
      ) : jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {jobs.map((job) => (
            <Link key={job.id} href={`/jobs/${job.id}`} className="block">
              <Card className="h-full transition-shadow hover:shadow-md">
                <CardContent className="p-6">
                  <div className="flex flex-col h-full">
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-lg">{job.title}</h3>
                        <Badge
                          variant={
                            job.employmentType === "full-time"
                              ? "default"
                              : "outline"
                          }
                        >
                          {job.employmentType.replace("-", " ")}
                        </Badge>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Building className="h-4 w-4" />
                          <span>{job.companyName}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          <span>
                            {job.location} ({job.locationType})
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            Posted{" "}
                            {formatDistanceToNow(toDate(job.postedAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-4">
                      <div className="flex flex-wrap gap-2">
                        {job.skills &&
                          job.skills.slice(0, 3).map((skill) => (
                            <Badge key={skill} variant="secondary">
                              {skill}
                            </Badge>
                          ))}
                        {job.skills && job.skills.length > 3 && (
                          <Badge variant="secondary">
                            +{job.skills.length - 3} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 border rounded-lg bg-muted/50">
          <h3 className="text-xl font-medium mb-2">
            No featured jobs available
          </h3>
          <p className="text-muted-foreground mb-4">
            Check back soon for new opportunities
          </p>
          <Button asChild>
            <Link href="/jobs">Browse All Jobs</Link>
          </Button>
        </div>
      )}
    </section>
  );
}
