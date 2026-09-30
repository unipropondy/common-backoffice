import { useLoader } from "../context/LoaderContext";
import "./loader.css";

function GlobalLoader() {
  const { loading } = useLoader();

  if (!loading) return null;

  return (
    <div className="loader-overlay">
      <div className="spinner"></div>
    </div>
  );
}

export default GlobalLoader;