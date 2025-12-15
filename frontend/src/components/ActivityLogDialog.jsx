import { Fragment } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  List,
  ListItem,
  Avatar,
  Divider,
  Button,
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';

function ActivityLogDialog({ open, activities, onClose }) {
  const formatActivityAction = (activity) => {
    switch (activity.action) {
      case 'CREATE':
        return 'added an expense';
      case 'UPDATE':
        return 'updated an expense';
      case 'DELETE':
        return 'deleted an expense';
      case 'DELETE_ALL':
        return 'reset all expenses';
      default:
        return activity.action.toLowerCase();
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <HistoryIcon />
          Activity Log
        </Box>
      </DialogTitle>
      <DialogContent>
        {activities.length === 0 ? (
          <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
            No activities yet.
          </Typography>
        ) : (
          <List>
            {activities.map((activity, index) => (
              <Fragment key={activity.id}>
                <ListItem alignItems="flex-start" sx={{ px: 0 }}>
                  <Box sx={{ display: 'flex', gap: 2, width: '100%', flexDirection: { xs: 'column', sm: 'row' } }}>
                    <Avatar src={activity.userPicture} sx={{ width: 40, height: 40 }}>
                      {activity.userName?.charAt(0)}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                        <strong>{activity.userName || 'Unknown User'}</strong> {formatActivityAction(activity)}
                      </Typography>
                      {activity.details && (
                        <Typography variant="caption" color="text.secondary" component="div" sx={{ wordBreak: 'break-word' }}>
                          {activity.action === 'CREATE' && (
                            <>Amount: ₹{activity.details.amount}, Paid by ID: {activity.details.paidBy}</>
                          )}
                          {activity.action === 'UPDATE' && (
                            <>Updated from ₹{activity.details.old?.amount} to ₹{activity.details.new?.amount}</>
                          )}
                          {activity.action === 'DELETE' && (
                            <>Amount: ₹{activity.details.amount}</>
                          )}
                          {activity.action === 'DELETE_ALL' && (
                            <>Deleted {activity.details.count} expenses</>
                          )}
                        </Typography>
                      )}
                      <Typography variant="caption" color="text.secondary">
                        {new Date(activity.createdAt).toLocaleString()}
                      </Typography>
                    </Box>
                  </Box>
                </ListItem>
                {index < activities.length - 1 && <Divider />}
              </Fragment>
            ))}
          </List>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}

export default ActivityLogDialog;
