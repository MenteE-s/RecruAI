import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import TextInterview from "../../components/interviews/TextInterview";
import { getSidebarItems } from "../../utils/auth";

export default function PracticeRoom() {
  const { sessionId } = useParams();
  const role =
    typeof window !== "undefined" ? localStorage.getItem("authRole") : null;
  const plan =
    typeof window !== "undefined" ? localStorage.getItem("authPlan") : null;
  const sidebarItems = getSidebarItems(role, plan);
  const [session, setSession] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(`/api/interviews/${sessionId}`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setSession(data.interview || data);
      }
    })();
  }, [sessionId]);

  return (
    <DashboardLayout
      NavbarComponent={IndividualNavbar}
      sidebarItems={sidebarItems}
    >
      {!session ? (
        <Card>
          <p>Loading practice session...</p>
        </Card>
      ) : (
        <TextInterview
          interviewId={session.id}
          interviewData={session}
          isInterviewer={false}
          interviewMode={"auto"}
        />
      )}
    </DashboardLayout>
  );
}
