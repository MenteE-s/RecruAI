import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import DashboardLayout from "../../components/layout/DashboardLayout";
import IndividualNavbar from "../../components/layout/IndividualNavbar";
import Card from "../../components/ui/Card";
import TextInterview from "../../components/interviews/TextInterview";
import { getBackendUrl } from "../../utils/auth";

export default function PracticeRoom() {
  const { sessionId } = useParams();

  const [session, setSession] = useState(null);

  useEffect(() => {
    (async () => {
      const res = await fetch(
        `${getBackendUrl()}/api/interviews/${sessionId}`,
        {
          credentials: "include",
        }
      );
      if (res.ok) {
        const data = await res.json();
        setSession(data.interview || data);
      }
    })();
  }, [sessionId]);

  return (
    <DashboardLayout
      NavbarComponent={IndividualNavbar}>
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
