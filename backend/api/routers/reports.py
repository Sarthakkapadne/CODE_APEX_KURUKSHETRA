"""
LexPort — PDF Dossier Export Router
Generates and downloads the official ReportLab Cross-Border Compliance Audit Dossier.
"""
from __future__ import annotations
from fastapi import APIRouter, Response, HTTPException
from backend.core.models import AuditResponse
from backend.modules.reports.pdf_generator import ComplianceReportGenerator

router = APIRouter()


@router.post("/pdf", summary="Export official Cross-Border Compliance Audit Dossier PDF")
async def export_compliance_pdf(audit_data: AuditResponse):
    try:
        pdf_bytes = ComplianceReportGenerator.generate_pdf(audit_data)
        filename = f"LexPort_Dossier_{audit_data.inspection_id}.pdf"
        return Response(
            content=pdf_bytes,
            media_type="application/pdf",
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "X-Inspection-ID": audit_data.inspection_id,
                "X-Compliance-Hash": audit_data.compliance_hash,
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {str(e)}")
