#!/usr/bin/env python3
"""
Markdown to PDF Converter
Converts CRM_FEATURE_ROADMAP.md to PDF
"""

import markdown2
from reportlab.lib.pagesizes import letter, A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
import re
import os

def markdown_to_pdf(markdown_file, output_pdf):
    # Read markdown file
    with open(markdown_file, 'r', encoding='utf-8') as f:
        markdown_content = f.read()

    # Convert markdown to HTML
    html_content = markdown2.markdown(
        markdown_content,
        extras=['fenced-code-blocks', 'tables', 'header-ids', 'toc']
    )

    # Create PDF document
    doc = SimpleDocTemplate(
        output_pdf,
        pagesize=A4,
        rightMargin=72,
        leftMargin=72,
        topMargin=72,
        bottomMargin=18
    )

    # Get styles
    styles = getSampleStyleSheet()

    # Custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Heading1'],
        fontSize=24,
        spaceAfter=30,
        textColor=colors.HexColor('#2563eb'),
        alignment=1  # Center alignment
    )

    heading1_style = ParagraphStyle(
        'CustomHeading1',
        parent=styles['Heading1'],
        fontSize=18,
        spaceAfter=12,
        textColor=colors.HexColor('#1e40af')
    )

    heading2_style = ParagraphStyle(
        'CustomHeading2',
        parent=styles['Heading2'],
        fontSize=16,
        spaceAfter=10,
        textColor=colors.HexColor('#1e3a8a')
    )

    heading3_style = ParagraphStyle(
        'CustomHeading3',
        parent=styles['Heading3'],
        fontSize=14,
        spaceAfter=8,
        textColor=colors.HexColor('#1e3a8a')
    )

    # Story (content) list
    story = []

    # Process HTML content
    lines = html_content.split('\n')

    for line in lines:
        line = line.strip()

        if not line:
            continue

        # Handle headers
        if line.startswith('<h1'):
            text = re.sub(r'<[^>]+>', '', line)
            story.append(Paragraph(text, title_style))
            story.append(Spacer(1, 12))

        elif line.startswith('<h2'):
            text = re.sub(r'<[^>]+>', '', line)
            story.append(Paragraph(text, heading1_style))
            story.append(Spacer(1, 6))

        elif line.startswith('<h3'):
            text = re.sub(r'<[^>]+>', '', line)
            story.append(Paragraph(text, heading2_style))
            story.append(Spacer(1, 6))

        elif line.startswith('<h4'):
            text = re.sub(r'<[^>]+>', '', line)
            story.append(Paragraph(text, heading3_style))
            story.append(Spacer(1, 6))

        # Handle tables
        elif line.startswith('<table'):
            # Skip table tag and process rows
            continue

        elif line.startswith('<tr'):
            # Process table row
            continue

        elif line.startswith('<th') or line.startswith('<td'):
            # Skip individual cells
            continue

        elif line.startswith('</table>'):
            # End of table
            story.append(Spacer(1, 12))

        # Handle lists
        elif line.startswith('<li'):
            text = re.sub(r'<[^>]+>', '', line)
            text = "• " + text
            story.append(Paragraph(text, styles['Normal']))
            story.append(Spacer(1, 3))

        # Handle paragraphs
        elif line.startswith('<p'):
            text = re.sub(r'<[^>]+>', '', line)
            # Handle special formatting
            text = text.replace('**', '<b>').replace('**', '</b>')
            text = text.replace('*', '<i>').replace('*', '</i>')
            story.append(Paragraph(text, styles['Normal']))
            story.append(Spacer(1, 6))

        # Handle horizontal rules
        elif line.startswith('<hr'):
            story.append(Spacer(1, 12))
            story.append(Paragraph('<HR />', styles['Normal']))

        # Handle code blocks
        elif line.startswith('<pre') or line.startswith('<code'):
            text = re.sub(r'<[^>]+>', '', line)
            story.append(Paragraph(f'<pre>{text}</pre>', styles['Code']))

        # Handle blockquotes
        elif line.startswith('<blockquote'):
            text = re.sub(r'<[^>]+>', '', line)
            story.append(Paragraph(text, styles['Normal']))

        # Handle other elements
        else:
            # Clean up HTML tags
            text = re.sub(r'<[^>]+>', '', line)
            if text:
                # Handle bold/italic
                text = text.replace('**', '<b>').replace('**', '</b>')
                text = text.replace('*', '<i>').replace('*', '</i>')
                story.append(Paragraph(text, styles['Normal']))
                story.append(Spacer(1, 6))

    # Build PDF
    print("Building PDF...")
    doc.build(story)
    print(f"PDF created successfully: {output_pdf}")

if __name__ == '__main__':
    input_file = 'CRM_FEATURE_ROADMAP.md'
    output_file = 'CRM_FEATURE_ROADMAP.pdf'

    if os.path.exists(input_file):
        markdown_to_pdf(input_file, output_file)
        print(f"\n✅ Conversion complete!")
        print(f"📄 Input: {input_file}")
        print(f"📄 Output: {output_file}")
    else:
        print(f"❌ Error: {input_file} not found!")
