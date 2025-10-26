import { CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const NetworkConfirmed = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <Card className="w-full max-w-lg text-center">
        <CardHeader className="flex flex-col items-center gap-4">
          <CheckCircle2 className="h-12 w-12 text-emerald-500" />
          <CardTitle className="text-3xl">You're all set!</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground">
          <p>Our team has received your request and will reach out with matched candidates shortly.</p>
          <Button asChild>
            <Link to="/workspace">Return to Workspace</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default NetworkConfirmed;
