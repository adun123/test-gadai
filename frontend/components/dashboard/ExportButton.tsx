"use client";

import { generateAssessmentPDF } from "@/lib/pdf-generator";
import { Download, Loader2 } from "lucide-react";
import { useState } from "react";

type ExportButtonProps = {
    data: {
        document?: any;
        vehicle?: any;
        pricing?: any;
    };
    disabled?: boolean;
};

export default function ExportButton({ data, disabled }: ExportButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleExport = async () => {
        try {
            setLoading(true);
            await generateAssessmentPDF(data);
        } catch (e) {
            console.error(e);
            alert("Failed to generate PDF");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed bottom-6 left-6 lg:left-10 z-40">
            <button
                type="button"
                onClick={handleExport}
                disabled={disabled || loading}
                className="bg-primary text-primary-foreground hover:bg-primary/90 shadow-xl px-6 py-3 rounded-full font-bold flex items-center gap-2 transition-all transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                    <Download className="w-5 h-5" />
                )}
                Export Hasil Analytics
            </button>
        </div>
    );
}
