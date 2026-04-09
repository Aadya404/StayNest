from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, mm
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable
from reportlab.lib.enums import TA_RIGHT, TA_CENTER
import io
from datetime import datetime


def generate_invoice_pdf(invoice_data):
    """Generate a PDF invoice and return it as bytes."""
    buffer = io.BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, topMargin=30*mm, bottomMargin=30*mm,
                           leftMargin=25*mm, rightMargin=25*mm)

    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle('InvoiceTitle', parent=styles['Heading1'],
                                  fontSize=24, textColor=colors.HexColor('#FF385C'),
                                  spaceAfter=6)
    subtitle_style = ParagraphStyle('Subtitle', parent=styles['Normal'],
                                     fontSize=10, textColor=colors.HexColor('#767676'),
                                     spaceAfter=20)
    heading_style = ParagraphStyle('SectionHeading', parent=styles['Heading2'],
                                    fontSize=14, textColor=colors.HexColor('#222222'),
                                    spaceBefore=15, spaceAfter=10)
    normal_style = ParagraphStyle('NormalText', parent=styles['Normal'],
                                   fontSize=10, textColor=colors.HexColor('#484848'),
                                   leading=16)
    right_style = ParagraphStyle('RightText', parent=normal_style, alignment=TA_RIGHT)
    bold_style = ParagraphStyle('BoldText', parent=normal_style,
                                 fontName='Helvetica-Bold')

    elements = []

    # Header
    elements.append(Paragraph("StayNest", title_style))
    elements.append(Paragraph("Rental Marketplace - Tax Invoice", subtitle_style))
    elements.append(HRFlowable(width="100%", thickness=2, color=colors.HexColor('#FF385C'),
                                spaceAfter=15))

    # Invoice details
    inv_num = invoice_data.get('invoice_number', 'N/A')
    paid_at = invoice_data.get('paid_at', datetime.now().strftime('%Y-%m-%d'))

    invoice_info = [
        [Paragraph(f"<b>Invoice Number:</b> {inv_num}", normal_style),
         Paragraph(f"<b>Date:</b> {paid_at}", right_style)],
        [Paragraph(f"<b>Transaction ID:</b> {invoice_data.get('transaction_id', 'N/A')}", normal_style),
         Paragraph(f"<b>Payment Method:</b> {(invoice_data.get('payment_method') or 'N/A').replace('_', ' ').title()}", right_style)],
    ]
    t = Table(invoice_info, colWidths=[doc.width/2]*2)
    t.setStyle(TableStyle([('VALIGN', (0,0), (-1,-1), 'TOP'),
                           ('TOPPADDING', (0,0), (-1,-1), 2),
                           ('BOTTOMPADDING', (0,0), (-1,-1), 2)]))
    elements.append(t)
    elements.append(Spacer(1, 15))

    # Guest and Host info
    elements.append(Paragraph("Booking Details", heading_style))
    guest_name = f"{invoice_data.get('guest_first_name', '')} {invoice_data.get('guest_last_name', '')}"
    host_name = f"{invoice_data.get('host_first_name', '')} {invoice_data.get('host_last_name', '')}"

    details = [
        [Paragraph("<b>Guest</b>", bold_style), Paragraph("<b>Host</b>", bold_style)],
        [Paragraph(guest_name, normal_style), Paragraph(host_name, normal_style)],
        [Paragraph(invoice_data.get('guest_email', ''), normal_style),
         Paragraph(invoice_data.get('host_email', ''), normal_style)],
    ]
    t = Table(details, colWidths=[doc.width/2]*2)
    t.setStyle(TableStyle([
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('TOPPADDING', (0,0), (-1,-1), 3),
        ('BOTTOMPADDING', (0,0), (-1,-1), 3),
        ('LINEBELOW', (0,0), (-1,0), 1, colors.HexColor('#EBEBEB')),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 10))

    # Property info
    elements.append(Paragraph("Property", heading_style))
    elements.append(Paragraph(invoice_data.get('property_title', 'N/A'), bold_style))
    addr = f"{invoice_data.get('address', '')}, {invoice_data.get('city', '')}, {invoice_data.get('state', '')}"
    elements.append(Paragraph(addr, normal_style))
    elements.append(Spacer(1, 5))

    stay_info = [
        [Paragraph("<b>Check-in</b>", bold_style), Paragraph("<b>Check-out</b>", bold_style),
         Paragraph("<b>Nights</b>", bold_style), Paragraph("<b>Guests</b>", bold_style)],
        [Paragraph(str(invoice_data.get('check_in', '')), normal_style),
         Paragraph(str(invoice_data.get('check_out', '')), normal_style),
         Paragraph(str(invoice_data.get('total_nights', '')), normal_style),
         Paragraph(str(invoice_data.get('num_guests', '')), normal_style)],
    ]
    t = Table(stay_info, colWidths=[doc.width/4]*4)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#F7F7F7')),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#EBEBEB')),
    ]))
    elements.append(t)
    elements.append(Spacer(1, 15))

    # Price breakdown
    elements.append(Paragraph("Price Breakdown", heading_style))

    ppn = invoice_data.get('price_per_night', 0) or 0
    nights = invoice_data.get('total_nights', 0) or 0
    cf = invoice_data.get('cleaning_fee', 0) or 0
    sf = invoice_data.get('service_fee', 0) or 0
    total = invoice_data.get('total_price', 0) or 0

    price_data = [
        [Paragraph(f"Rs. {ppn:,.2f} x {nights} nights", normal_style),
         Paragraph(f"Rs. {ppn * nights:,.2f}", right_style)],
        [Paragraph("Cleaning fee", normal_style),
         Paragraph(f"Rs. {cf:,.2f}", right_style)],
        [Paragraph("Service fee", normal_style),
         Paragraph(f"Rs. {sf:,.2f}", right_style)],
    ]
    t = Table(price_data, colWidths=[doc.width*0.7, doc.width*0.3])
    t.setStyle(TableStyle([
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
        ('LINEBELOW', (0,0), (-1,-1), 0.5, colors.HexColor('#EBEBEB')),
    ]))
    elements.append(t)

    # Total
    total_data = [
        [Paragraph("<b>Total (INR)</b>", ParagraphStyle('TotalLabel', parent=bold_style, fontSize=13)),
         Paragraph(f"<b>Rs. {total:,.2f}</b>", ParagraphStyle('TotalAmount', parent=bold_style,
                    fontSize=13, alignment=TA_RIGHT, textColor=colors.HexColor('#FF385C')))],
    ]
    t = Table(total_data, colWidths=[doc.width*0.7, doc.width*0.3])
    t.setStyle(TableStyle([
        ('TOPPADDING', (0,0), (-1,-1), 10),
        ('BOTTOMPADDING', (0,0), (-1,-1), 10),
        ('BACKGROUND', (0,0), (-1,-1), colors.HexColor('#FFF5F5')),
        ('LINEABOVE', (0,0), (-1,0), 2, colors.HexColor('#FF385C')),
    ]))
    elements.append(t)

    # Footer
    elements.append(Spacer(1, 30))
    elements.append(HRFlowable(width="100%", thickness=1, color=colors.HexColor('#EBEBEB'),
                                spaceAfter=10))
    footer_style = ParagraphStyle('Footer', parent=styles['Normal'], fontSize=8,
                                   textColor=colors.HexColor('#767676'), alignment=TA_CENTER)
    elements.append(Paragraph("This is a computer-generated invoice. No signature is required.", footer_style))
    elements.append(Paragraph("StayNest Rental Marketplace | support@staynest.com", footer_style))

    doc.build(elements)
    buffer.seek(0)
    return buffer.getvalue()
