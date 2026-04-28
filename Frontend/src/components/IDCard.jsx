import { Box, Button, Dialog, DialogContent, DialogActions, Typography } from '@mui/material';
import { Print, Close } from '@mui/icons-material';
import { useState } from 'react';

export default function IDCard({ student, onClose }) {
  const [open, setOpen] = useState(true);

  const handlePrint = () => {
    window.print();
  };

  const handleClose = () => {
    setOpen(false);
    onClose?.();
  };

  if (!student) return null;

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogActions sx={{ justifyContent: 'space-between', px: 2, py: 1, '@media print': { display: 'none' } }}>
        <Typography variant="h6" color="primary">Student ID Card</Typography>
        <Box>
          <Button startIcon={<Print />} onClick={handlePrint} variant="contained" size="small" sx={{ mr: 1 }}>
            Print
          </Button>
          <Button startIcon={<Close />} onClick={handleClose} size="small">
            Close
          </Button>
        </Box>
      </DialogActions>
      <DialogContent sx={{ p: 0, '@media print': { p: 0 } }}>
        <style>{`
          @media print {
            /* Page setup */
            @page {
              size: A4 portrait;
              margin: 15mm;
            }
            
            /* Hide everything except print area */
            body * {
              visibility: hidden;
            }
            
            #id-card-print-area,
            #id-card-print-area * {
              visibility: visible;
            }
            
            /* Remove all dialog chrome */
            html, body {
              height: auto !important;
              overflow: visible !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            
            #id-card-print-area {
              position: absolute;
              left: 0;
              top: 0;
              margin: 0 !important;
              padding: 0 !important;
              background: none !important;
            }
            
            /* Card side page breaks */
            .id-card-side {
              page-break-after: always;
              page-break-inside: avoid;
              display: block !important;
              margin: 0 auto 0 auto !important;
              padding: 0 !important;
            }
            
            .id-card-side:last-child {
              page-break-after: auto;
            }
            
            /* Hide screen-only elements */
            .MuiDialogActions-root,
            .print-hide {
              display: none !important;
            }
          }
        `}</style>

        <Box id="id-card-print-area" sx={{ p: { xs: 2, sm: 4 }, bgcolor: '#f5f5f5', '@media print': { p: 0, bgcolor: 'transparent' } }}>
          {/* Front Side */}
          <Box
            className="id-card-side"
            sx={{
              width: '350px',
              height: '520px',
              margin: '0 auto 30px',
              borderRadius: '15px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              background: 'linear-gradient(135deg, #1C2C56 0%, #2a3f73 100%)',
              position: 'relative',
              '@media print': {
                margin: '0 auto 0 auto',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              }
            }}
          >
            {/* Header */}
            <Box sx={{ bgcolor: '#8fc750', p: 1.5, textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={700} color="#1C2C56" sx={{ fontSize: '1.1rem' }}>
               The Dimension Public School
              </Typography>
              <Typography variant="caption" sx={{ color: '#1C2C56', fontWeight: 600, fontSize: '0.7rem' }}>
                STUDENT IDENTITY CARD
              </Typography>
            </Box>

            {/* Photo */}
            <Box sx={{ textAlign: 'center', py: 1.5 }}>
              <Box
                component="img"
                src={student.photo?.url || '/default-avatar.png'}
                alt={student.firstName}
                sx={{
                  width: 110,
                  height: 110,
                  borderRadius: '10px',
                  border: '4px solid #8fc750',
                  objectFit: 'cover',
                  bgcolor: '#fff',
                }}
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
              <Box
                sx={{
                  display: 'none',
                  width: 110,
                  height: 110,
                  borderRadius: '10px',
                  border: '4px solid #8fc750',
                  bgcolor: '#fff',
                  margin: '0 auto',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '2.5rem',
                  fontWeight: 700,
                  color: '#1C2C56',
                }}
              >
                {student.firstName?.[0]}{student.lastName?.[0]}
              </Box>
            </Box>

            {/* Student Details */}
            <Box sx={{ px: 2.5, pb: 1.5 }}>
              <Box sx={{ bgcolor: '#fff', borderRadius: '8px', p: 1.5, mb: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>
                  NAME
                </Typography>
                <Typography variant="body2" fontWeight={700} color="#1C2C56" sx={{ fontSize: '0.9rem' }}>
                  {student.firstName} {student.lastName}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <Box sx={{ bgcolor: '#fff', borderRadius: '8px', p: 1.5, flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>
                    ADM. NO
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="#1C2C56" sx={{ fontSize: '0.85rem' }}>
                    {student.admissionNo}
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: '#fff', borderRadius: '8px', p: 1.5, flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>
                    CLASS
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="#1C2C56" sx={{ fontSize: '0.85rem' }}>
                    {student.className}-{student.section}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ bgcolor: '#fff', borderRadius: '8px', p: 1.5, mb: 1 }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>
                  DATE OF BIRTH
                </Typography>
                <Typography variant="body2" fontWeight={700} color="#1C2C56" sx={{ fontSize: '0.85rem' }}>
                  {student.dob ? new Date(student.dob).toLocaleDateString('en-GB') : 'N/A'}
                </Typography>
              </Box>

              <Box sx={{ display: 'flex', gap: 1 }}>
                <Box sx={{ bgcolor: '#fff', borderRadius: '8px', p: 1.5, flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>
                    BLOOD GROUP
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="#1C2C56" sx={{ fontSize: '0.85rem' }}>
                    O+
                  </Typography>
                </Box>
                <Box sx={{ bgcolor: '#fff', borderRadius: '8px', p: 1.5, flex: 1 }}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>
                    ROLL NO
                  </Typography>
                  <Typography variant="body2" fontWeight={700} color="#1C2C56" sx={{ fontSize: '0.85rem' }}>
                    {student.rollNo || 'N/A'}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Footer */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 0,
                width: '100%',
                bgcolor: '#8fc750',
                py: 0.8,
                textAlign: 'center',
              }}
            >
              <Typography variant="caption" fontWeight={600} color="#1C2C56" sx={{ fontSize: '0.7rem' }}>
                Valid Till: 2027
              </Typography>
            </Box>
          </Box>

          {/* Back Side */}
          <Box
            className="id-card-side"
            sx={{
              width: '350px',
              height: '520px',
              margin: '0 auto',
              borderRadius: '15px',
              overflow: 'hidden',
              boxShadow: '0 4px 20px rgba(0,0,0,0.15)',
              background: 'linear-gradient(135deg, #1C2C56 0%, #2a3f73 100%)',
              position: 'relative',
              '@media print': {
                margin: '0 auto 0 auto',
                boxShadow: '0 2px 10px rgba(0,0,0,0.2)',
              }
            }}
          >
            {/* Header */}
            <Box sx={{ bgcolor: '#8fc750', p: 1.5, textAlign: 'center' }}>
              <Typography variant="h6" fontWeight={700} color="#1C2C56" sx={{ fontSize: '1.1rem' }}>
                IMPORTANT INFORMATION
              </Typography>
            </Box>

            {/* Contact Details */}
            <Box sx={{ p: 2.5 }}>
              <Box sx={{ bgcolor: '#fff', borderRadius: '8px', p: 1.5, mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>
                  PARENT/GUARDIAN NAME
                </Typography>
                <Typography variant="body2" fontWeight={700} color="#1C2C56" sx={{ fontSize: '0.85rem' }}>
                  {student.parentName || 'N/A'}
                </Typography>
              </Box>

              <Box sx={{ bgcolor: '#fff', borderRadius: '8px', p: 1.5, mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>
                  EMERGENCY CONTACT
                </Typography>
                <Typography variant="body2" fontWeight={700} color="#1C2C56" sx={{ fontSize: '0.85rem' }}>
                  {student.parentMobile || 'N/A'}
                </Typography>
              </Box>

              <Box sx={{ bgcolor: '#fff', borderRadius: '8px', p: 1.5, mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary" display="block" sx={{ fontSize: '0.65rem' }}>
                  ADDRESS
                </Typography>
                <Typography 
                  variant="body2" 
                  fontWeight={600} 
                  color="#1C2C56" 
                  sx={{ 
                    wordBreak: 'break-word',
                    fontSize: '0.75rem',
                    lineHeight: 1.3,
                    maxHeight: '3.6em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                  }}
                >
                  {student.address || 'N/A'}
                </Typography>
              </Box>

              <Box sx={{ bgcolor: '#fff', borderRadius: '8px', p: 1.5, mb: 1.5 }}>
                <Typography variant="caption" color="text.secondary" display="block" gutterBottom sx={{ fontSize: '0.65rem' }}>
                  SCHOOL CONTACT
                </Typography>
                <Typography variant="body2" fontWeight={600} color="#1C2C56" sx={{ fontSize: '0.75rem' }}>
                  +91 8981015354
                </Typography>
                <Typography variant="body2" fontWeight={600} color="#1C2C56" sx={{ fontSize: '0.75rem' }}>
                  thedimensionpublicschool@gmail.com
                </Typography>
              </Box>

              <Box sx={{ bgcolor: '#fff', borderRadius: '8px', p: 1.5, textAlign: 'center', mb: 1.5 }}>
                <Typography variant="caption" color="error" fontWeight={600} sx={{ fontSize: '0.7rem' }}>
                  ⚠️ If found, please return to school
                </Typography>
              </Box>
            </Box>

            {/* Footer with Signature */}
            <Box
              sx={{
                position: 'absolute',
                bottom: 15,
                width: '100%',
                px: 2.5,
              }}
            >
              <Box sx={{ bgcolor: '#fff', borderRadius: '8px', p: 1.5, textAlign: 'center' }}>
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                  ______________________
                </Typography>
                <Typography variant="caption" display="block" fontWeight={600} color="#1C2C56" sx={{ fontSize: '0.7rem' }}>
                  Principal's Signature
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}