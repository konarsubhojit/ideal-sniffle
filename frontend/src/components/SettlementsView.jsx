import { Fragment } from 'react';
import {
  Paper,
  Typography,
  List,
  ListItem,
  Box,
  Chip,
  Divider,
} from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';

function SettlementsView({ optimizedSettlements = [] }) {
  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 } }}>
      <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
        Optimized Settlement Plan ({optimizedSettlements.length} transaction{optimizedSettlements.length !== 1 ? 's' : ''})
      </Typography>
      {optimizedSettlements.length === 0 ? (
        <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
          All settled! No payments needed.
        </Typography>
      ) : (
        <List>
          {optimizedSettlements.map((transaction, index) => (
            <Fragment key={index}>
              <ListItem sx={{ px: 0, flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 1, sm: 2 } }}>
                <Box sx={{ 
                  width: '100%', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: { xs: 1, sm: 2 },
                  flexWrap: { xs: 'wrap', sm: 'nowrap' }
                }}>
                  <Chip 
                    label={transaction.fromName} 
                    color="error" 
                    variant="outlined"
                    sx={{ minWidth: { xs: '100px', sm: '150px' }, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                  />
                  <ArrowForwardIcon color="action" sx={{ fontSize: { xs: '1.2rem', sm: '1.5rem' } }} />
                  <Chip 
                    label={transaction.toName} 
                    color="success" 
                    variant="outlined"
                    sx={{ minWidth: { xs: '100px', sm: '150px' }, fontSize: { xs: '0.8rem', sm: '0.875rem' } }}
                  />
                  <Box sx={{ ml: { xs: 0, sm: 'auto' }, width: { xs: '100%', sm: 'auto' }, textAlign: { xs: 'center', sm: 'right' } }}>
                    <Typography variant="h6" color="primary" sx={{ fontWeight: 600, fontSize: { xs: '1.1rem', sm: '1.25rem' } }}>
                      ₹{transaction.amount.toFixed(2)}
                    </Typography>
                  </Box>
                </Box>
              </ListItem>
              {index < optimizedSettlements.length - 1 && <Divider />}
            </Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
}

export default SettlementsView;
