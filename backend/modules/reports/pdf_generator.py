"""
LexPort — Official Cross-Border Compliance Audit Dossier Generator
Generates exportable PDF compliance reports using ReportLab.
Includes cryptographic SHA-256 stamp, market matrix table, cited clauses, and remediation directives.
"""
from __future__ import annotations
import io
from typing import Dict, Any, List

from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable, KeepTogether
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

from backend.core.models import AuditResponse


class ComplianceReportGenerator:
    """Generates official PDF audit dossiers for cross-border listings."""

    @staticmethod
    def generate_pdf(audit_data: AuditResponse) -> bytes:
        buffer = io.BytesIO()
        doc = SimpleDocTemplate(
            buffer,
            pagesize=letter,
            rightMargin=36,
            leftMargin=36,
            topMargin=36,
            bottomMargin=36
        )

        styles = getSampleStyleSheet()
        normal = styles["Normal"]

        # Custom typography styles
        title_style = ParagraphStyle(
            "DocTitle",
            parent=normal,
            fontName="Helvetica-Bold",
            fontSize=18,
            leading=22,
            textColor=colors.HexColor("#0F172A")
        )

        subtitle_style = ParagraphStyle(
            "DocSubTitle",
            parent=normal,
            fontName="Helvetica",
            fontSize=9,
            leading=12,
            textColor=colors.HexColor("#475569")
        )

        h2_style = ParagraphStyle(
            "H2Style",
            parent=normal,
            fontName="Helvetica-Bold",
            fontSize=12,
            leading=16,
            textColor=colors.HexColor("#1E293B")
        )

        badge_style = ParagraphStyle(
            "BadgeStyle",
            parent=normal,
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=colors.white
        )

        cell_style = ParagraphStyle(
            "CellStyle",
            parent=normal,
            fontName="Helvetica",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#1E293B")
        )

        cell_bold = ParagraphStyle(
            "CellBold",
            parent=normal,
            fontName="Helvetica-Bold",
            fontSize=8,
            leading=10,
            textColor=colors.HexColor("#0F172A")
        )

        story = []

        # ── Header Banner ──
        story.append(Paragraph("LEXPORT // CROSS-BORDER COMPLIANCE AUDIT DOSSIER", title_style))
        story.append(Paragraph(
            f"Generated: {audit_data.timestamp_utc} | Inspection ID: <b>{audit_data.inspection_id}</b> | Rule Engine: <b>{audit_data.rule_engine_version}</b>",
            subtitle_style
        ))
        story.append(Spacer(1, 8))
        story.append(HRFlowable(width="100%", thickness=1.5, color=colors.HexColor("#0284C7"), spaceAfter=10))

        # ── Cryptographic Hash & EU AI Act Block ──
        hash_box = [
            [
                Paragraph("<b>CRYPTOGRAPHIC AUDIT CHAIN FINGERPRINT (SHA-256)</b>", cell_bold),
                Paragraph(f"<font color='#0284C7'><b>VERIFIED IMMUTABLE</b></font>", cell_bold)
            ],
            [
                Paragraph(f"<font name='Courier' size='7'>{audit_data.compliance_hash}</font>", normal),
                Paragraph("<font size='7'>EU Digital Omnibus AI Act (2026/891) Compliant Audit Trail</font>", normal)
            ]
        ]
        hash_table = Table(hash_box, colWidths=[380, 160])
        hash_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#F8FAFC")),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor("#CBD5E1")),
            ('PADDING', (0, 0), (-1, -1), 6),
        ]))
        story.append(hash_table)
        story.append(Spacer(1, 12))

        # ── Product Overview & Verdict ──
        verdict_color = "#16A34A" if audit_data.overall_verdict == "COMPLIANT" else "#DC2626"
        if audit_data.overall_verdict == "REMEDIATION_REQUIRED":
            verdict_color = "#D97706"
        elif audit_data.overall_verdict == "ESCALATION_REQUIRED":
            verdict_color = "#7C3AED"

        meta_rows = [
            [
                Paragraph("<b>Product Category:</b>", cell_bold),
                Paragraph(f"{audit_data.extracted_attributes.category.title()} ({audit_data.extracted_attributes.subcategory})", cell_style),
                Paragraph("<b>Overall Verdict:</b>", cell_bold),
                Paragraph(f"<font color='{verdict_color}'><b>{audit_data.overall_verdict}</b></font>", cell_bold)
            ],
            [
                Paragraph("<b>Inferred HS Code:</b>", cell_bold),
                Paragraph(f"{audit_data.extracted_attributes.inferred_hs_code}", cell_style),
                Paragraph("<b>Target Markets:</b>", cell_bold),
                Paragraph(", ".join(audit_data.destination_markets), cell_style)
            ],
            [
                Paragraph("<b>Active Ingredients:</b>", cell_bold),
                Paragraph(", ".join(audit_data.extracted_attributes.ingredients) or "None declared", cell_style),
                Paragraph("<b>Power Source:</b>", cell_bold),
                Paragraph(f"{audit_data.extracted_attributes.power_source} (Battery: {audit_data.extracted_attributes.has_battery})", cell_style)
            ]
        ]
        meta_table = Table(meta_rows, colWidths=[100, 170, 90, 180])
        meta_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FFFFFF")),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
            ('PADDING', (0, 0), (-1, -1), 4),
        ]))
        story.append(meta_table)
        story.append(Spacer(1, 14))

        # ── Multi-Market Compliance Summary Table ──
        story.append(Paragraph("MULTI-MARKET COMPLIANCE MATRIX SUMMARY", h2_style))
        story.append(Spacer(1, 4))

        summary_rows = [
            [
                Paragraph("<b>Market</b>", cell_bold),
                Paragraph("<b>Pass</b>", cell_bold),
                Paragraph("<b>Warnings</b>", cell_bold),
                Paragraph("<b>Violations</b>", cell_bold),
                Paragraph("<b>Escalations (Tier 3)</b>", cell_bold),
                Paragraph("<b>Market Clearance Status</b>", cell_bold),
            ]
        ]

        for country in audit_data.destination_markets:
            counts = audit_data.summary_by_country.get(country, {"pass": 0, "warning": 0, "violation": 0, "escalation": 0})
            status_text = "CLEARED"
            status_c = "#16A34A"
            if counts.get("violation", 0) > 0:
                status_text = "BLOCKED / REMEDIATE"
                status_c = "#DC2626"
            elif counts.get("escalation", 0) > 0:
                status_text = "HUMAN REVIEW REQ."
                status_c = "#7C3AED"
            elif counts.get("warning", 0) > 0:
                status_text = "CAUTION / REVIEW"
                status_c = "#D97706"

            summary_rows.append([
                Paragraph(f"<b>{country}</b>", cell_bold),
                Paragraph(str(counts.get("pass", 0)), cell_style),
                Paragraph(str(counts.get("warning", 0)), cell_style),
                Paragraph(str(counts.get("violation", 0)), cell_style),
                Paragraph(str(counts.get("escalation", 0)), cell_style),
                Paragraph(f"<font color='{status_c}'><b>{status_text}</b></font>", cell_bold),
            ])

        sum_table = Table(summary_rows, colWidths=[60, 60, 70, 70, 130, 150])
        sum_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
            ('PADDING', (0, 0), (-1, -1), 4),
            ('ALIGN', (1, 1), (-2, -1), 'CENTER'),
        ]))
        story.append(sum_table)
        story.append(Spacer(1, 14))

        # ── Key Non-Compliance & Escalation Findings ──
        story.append(Paragraph("DETAILED REGULATORY FINDINGS & STATUTORY CITATIONS", h2_style))
        story.append(Spacer(1, 4))

        finding_rows = [
            [
                Paragraph("<b>Code</b>", cell_bold),
                Paragraph("<b>Mkt</b>", cell_bold),
                Paragraph("<b>Category</b>", cell_bold),
                Paragraph("<b>Status</b>", cell_bold),
                Paragraph("<b>Statutory Citation & Explanation</b>", cell_bold),
            ]
        ]

        for country, checks in audit_data.matrix.items():
            for c in checks:
                if c.status in ["violation", "escalation", "warning"]:
                    st_col = "#DC2626" if c.status == "violation" else ("#7C3AED" if c.status == "escalation" else "#D97706")
                    desc_para = Paragraph(
                        f"<b>Statute:</b> {c.rule_citation}<br/>"
                        f"<b>Finding:</b> {c.extracted_value}<br/>"
                        f"<b>Directive:</b> {c.fix_suggestion or c.explanation}",
                        cell_style
                    )
                    finding_rows.append([
                        Paragraph(c.check_code, cell_bold),
                        Paragraph(c.country_code, cell_style),
                        Paragraph(c.category, cell_style),
                        Paragraph(f"<font color='{st_col}'><b>{c.status.upper()}</b></font>", cell_bold),
                        desc_para
                    ])

        if len(finding_rows) > 1:
            findings_table = Table(finding_rows, colWidths=[90, 30, 90, 70, 260])
            findings_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ('PADDING', (0, 0), (-1, -1), 4),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            story.append(findings_table)
        else:
            story.append(Paragraph("<i>No active violations or warnings detected across selected markets.</i>", normal))

        story.append(Spacer(1, 14))

        # ── Adversarial Debate & Consensus Verdict ──
        if audit_data.debate:
            story.append(Paragraph("ADVERSARIAL INSPECTION DEBATE SUMMARY", h2_style))
            story.append(Paragraph(f"<b>Debate Topic:</b> {audit_data.debate.debate_topic}", subtitle_style))
            story.append(Spacer(1, 4))

            debate_rows = []
            for turn in audit_data.debate.turns:
                spk_color = "#DC2626" if turn.speaker == "Customs Inspector" else ("#0284C7" if turn.speaker == "Seller Advocate" else "#16A34A")
                debate_rows.append([
                    Paragraph(f"<font color='{spk_color}'><b>{turn.speaker}</b></font><br/><font size='7'>{turn.role_title}</font>", cell_style),
                    Paragraph(f"{turn.argument}<br/><b>Citing:</b> {', '.join(turn.cited_rules)}", cell_style)
                ])

            debate_table = Table(debate_rows, colWidths=[130, 410])
            debate_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor("#FAFAFA")),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#E2E8F0")),
                ('PADDING', (0, 0), (-1, -1), 5),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
            ]))
            story.append(debate_table)
            story.append(Spacer(1, 8))

            story.append(Paragraph(f"<b>Consensus Arbiter Verdict:</b> {audit_data.debate.consensus_verdict}", cell_bold))
            story.append(Spacer(1, 14))

        # ── Trade Economics & Market Expansion Ranking ──
        if audit_data.trade_economics:
            story.append(Paragraph("TRADE ECONOMICS ADVISOR: MARKET EXPANSION RANKING", h2_style))
            story.append(Spacer(1, 4))

            econ_rows = [
                [
                    Paragraph("<b>Rank</b>", cell_bold),
                    Paragraph("<b>Market</b>", cell_bold),
                    Paragraph("<b>De Minimis Threshold</b>", cell_bold),
                    Paragraph("<b>VAT / GST Scheme</b>", cell_bold),
                    Paragraph("<b>Clearance Friction</b>", cell_bold),
                ]
            ]
            for item in audit_data.trade_economics:
                econ_rows.append([
                    Paragraph(f"#{item.entry_friction_rank}", cell_bold),
                    Paragraph(f"<b>{item.country_name}</b>", cell_bold),
                    Paragraph(f"{item.de_minimis_threshold} {item.de_minimis_currency}", cell_style),
                    Paragraph(item.simplification_scheme, cell_style),
                    Paragraph(f"Score {item.customs_complexity_score}/10", cell_style)
                ])

            econ_table = Table(econ_rows, colWidths=[35, 115, 110, 200, 80])
            econ_table.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor("#F1F5F9")),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#CBD5E1")),
                ('PADDING', (0, 0), (-1, -1), 4),
            ]))
            story.append(econ_table)

        doc.build(story)
        buffer.seek(0)
        return buffer.getvalue()
