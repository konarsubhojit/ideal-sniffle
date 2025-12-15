import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Button,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import ActivityList from './ActivityList';

function ActivityLogDialog({ open, activities, onClose }) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon />
          Activity Log
        </Box>
      </DialogTitle>
      <DialogContent>
        <ActivityList activities={activities} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ActivityLogDialog;
