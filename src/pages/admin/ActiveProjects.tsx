import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

/**
 * Temporary compatibility component to support legacy imports of the
 * former ActiveProjects page. Any module that still references this
 * component will be redirected to the canonical Ops Console route.
 */
const ActiveProjects = () => {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/admin/ops", { replace: true });
  }, [navigate]);

  return null;
};

export default ActiveProjects;
