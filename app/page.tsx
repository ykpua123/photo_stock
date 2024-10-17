import ResultsPage from "@/components/ResultsPage";
import EntryAnalyzer from "@/components/EntryAnalyzer";

import Image from "next/image";

export default function Home() {
  return (
    <div className="w-full md:w-1/2 mx-auto mb-60">
      <EntryAnalyzer />
      <ResultsPage />
    </div>


  );
}
