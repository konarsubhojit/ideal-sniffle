import { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  FormControl,
  CircularProgress,
  Chip,
  Grid,
  Alert,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Checkbox,
  FormControlLabel,
  List,
  ListItem,
  ListItemText,
  Divider,
  FormLabel,
} from '@mui/material';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import CreateIcon from '@mui/icons-material/Create';
import VisibilityIcon from '@mui/icons-material/Visibility';
import BlockIcon from '@mui/icons-material/Block';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { useUsers, useUserStats, useUpdateUserRole } from '../hooks/useUsers';
import { 
  useGroups, 
  useGroup, 
  useAddGroup, 
  useUpdateGroup, 
  useDeleteGroup,
  useAddGroupMember,
  useUpdateGroupMember,
  useDeleteGroupMember
} from '../hooks/useExpenses';
import { useSnackbar } from '../contexts/SnackbarContext';

function TabPanel({ children, value, index }) {
  return (
    <div hidden={value !== index} style={{ paddingTop: 24 }}>
      {value === index && children}
    </div>
  );
}

function AdminPage() {
  const [tabValue, setTabValue] = useState(0);
  const { data: users = [], isLoading: usersLoading } = useUsers();
  const { data: stats, isLoading: statsLoading } = useUserStats();
  const { data: groups = [], isLoading: groupsLoading } = useGroups();
  const updateUserRole = useUpdateUserRole();
  const addGroup = useAddGroup();
  const updateGroup = useUpdateGroup();
  const deleteGroup = useDeleteGroup();
  const addGroupMember = useAddGroupMember();
  const updateGroupMember = useUpdateGroupMember();
  const deleteGroupMember = useDeleteGroupMember();
  const showSnackbar = useSnackbar();

  const [groupDialogOpen, setGroupDialogOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [groupFormData, setGroupFormData] = useState({
    name: '',
    count: 1,
    type: 'Internal',
  });
  const [groupMembers, setGroupMembers] = useState([]);
  const [memberFormOpen, setMemberFormOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [memberFormData, setMemberFormData] = useState({
    name: '',
    isPaying: true,
    excludeFromAllHeadcount: false,
    excludeFromInternalHeadcount: false,
  });

  // Fetch group details when editing
  const { data: groupDetails } = useGroup(editingGroup?.id);

  useEffect(() => {
    if (groupDetails?.members) {
      setGroupMembers(groupDetails.members);
    }
  }, [groupDetails]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole.mutateAsync({ 
        userId, 
        role: newRole === 'none' ? null : newRole 
      });
      showSnackbar('Role updated! User must log out and log back in for the new permissions to take effect.', 'success');
    } catch (error) {
      console.error('Error updating role:', error);
      showSnackbar(error.message || 'Failed to update role', 'error');
    }
  };

  const handleOpenGroupDialog = (group = null) => {
    if (group) {
      setEditingGroup(group);
      setGroupFormData({
        name: group.name,
        count: group.count,
        type: group.type,
      });
      setGroupMembers(group.members || []);
    } else {
      setEditingGroup(null);
      setGroupFormData({ name: '', count: 1, type: 'Internal' });
      setGroupMembers([]);
    }
    setGroupDialogOpen(true);
  };

  const handleSaveGroup = async () => {
    try {
      if (editingGroup) {
        await updateGroup.mutateAsync({
          id: editingGroup.id,
          ...groupFormData,
        });
        showSnackbar('Group updated successfully!', 'success');
      } else {
        await addGroup.mutateAsync(groupFormData);
        showSnackbar('Group created successfully!', 'success');
      }
      setGroupDialogOpen(false);
    } catch (error) {
      console.error('Error saving group:', error);
      showSnackbar(error.message || 'Failed to save group', 'error');
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm('Are you sure you want to delete this group? This cannot be undone.')) {
      return;
    }
    
    try {
      await deleteGroup.mutateAsync(groupId);
      showSnackbar('Group deleted successfully!', 'success');
    } catch (error) {
      console.error('Error deleting group:', error);
      showSnackbar(error.message || 'Failed to delete group', 'error');
    }
  };

  const handleOpenMemberForm = (member = null) => {
    if (member) {
      setEditingMember(member);
      setMemberFormData({
        name: member.name,
        isPaying: member.isPaying,
        excludeFromAllHeadcount: member.excludeFromAllHeadcount,
        excludeFromInternalHeadcount: member.excludeFromInternalHeadcount,
      });
    } else {
      setEditingMember(null);
      setMemberFormData({
        name: '',
        isPaying: true,
        excludeFromAllHeadcount: false,
        excludeFromInternalHeadcount: false,
      });
    }
    setMemberFormOpen(true);
  };

  const handleSaveMember = async () => {
    if (!editingGroup) return;
    
    try {
      if (editingMember) {
        await updateGroupMember.mutateAsync({
          groupId: editingGroup.id,
          memberId: editingMember.id,
          ...memberFormData,
        });
        showSnackbar('Member updated successfully!', 'success');
      } else {
        await addGroupMember.mutateAsync({
          groupId: editingGroup.id,
          ...memberFormData,
        });
        showSnackbar('Member added successfully!', 'success');
      }
      setMemberFormOpen(false);
    } catch (error) {
      console.error('Error saving member:', error);
      showSnackbar(error.message || 'Failed to save member', 'error');
    }
  };

  const handleDeleteMember = async (memberId) => {
    if (!editingGroup || !window.confirm('Are you sure you want to remove this member?')) {
      return;
    }
    
    try {
      await deleteGroupMember.mutateAsync({
        groupId: editingGroup.id,
        memberId,
      });
      showSnackbar('Member removed successfully!', 'success');
    } catch (error) {
      console.error('Error removing member:', error);
      showSnackbar(error.message || 'Failed to remove member', 'error');
    }
  };

  const getRoleChip = (role) => {
    if (!role) {
      return <Chip icon={<BlockIcon />} label="No Access" size="small" color="default" />;
    }
    
    switch (role) {
      case 'admin':
        return <Chip icon={<AdminPanelSettingsIcon />} label="Admin" size="small" color="error" />;
      case 'contributor':
        return <Chip icon={<CreateIcon />} label="Contributor" size="small" color="success" />;
      case 'reader':
        return <Chip icon={<VisibilityIcon />} label="Reader" size="small" color="info" />;
      default:
        return <Chip label={role} size="small" />;
    }
  };

  if (usersLoading || statsLoading || groupsLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 600 }}>
        Admin Panel
      </Typography>

      {/* Statistics Cards */}
      {stats && (
        <Grid container spacing={3} sx={{ mb: 3 }}>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Total Users
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
                  {stats.total}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Admins
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'error.main' }}>
                  {stats.admins}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Contributors
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'success.main' }}>
                  {stats.contributors}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  Readers
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'info.main' }}>
                  {stats.readers}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={2.4}>
            <Card>
              <CardContent>
                <Typography color="text.secondary" gutterBottom variant="body2">
                  No Access
                </Typography>
                <Typography variant="h4" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  {stats.no_role}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      <Card>
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
          <Tab label="User Management" />
          <Tab label="Groups Management" />
        </Tabs>

        <TabPanel value={tabValue} index={0}>
          <CardContent>
            <Alert severity="info" sx={{ mb: 3 }}>
              Users must log out and log back in for role changes to take effect.
            </Alert>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Email</TableCell>
                    <TableCell>Current Role</TableCell>
                    <TableCell>Change Role</TableCell>
                    <TableCell>Last Login</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          {user.picture && (
                            <img 
                              src={user.picture} 
                              alt={user.name} 
                              style={{ width: 32, height: 32, borderRadius: '50%' }}
                            />
                          )}
                          {user.name}
                        </Box>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>{getRoleChip(user.role)}</TableCell>
                      <TableCell>
                        <FormControl size="small" sx={{ minWidth: 140 }}>
                          <Select
                            value={user.role || 'none'}
                            onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            disabled={updateUserRole.isPending}
                          >
                            <MenuItem value="admin">Admin</MenuItem>
                            <MenuItem value="contributor">Contributor</MenuItem>
                            <MenuItem value="reader">Reader</MenuItem>
                            <MenuItem value="none">No Access</MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        {user.lastLogin 
                          ? new Date(user.lastLogin).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6">Manage Groups</Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => handleOpenGroupDialog()}
              >
                Add Group
              </Button>
            </Box>

            <TableContainer component={Paper} variant="outlined">
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Name</TableCell>
                    <TableCell>Type</TableCell>
                    <TableCell>Member Count</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {groups.map((group) => (
                    <TableRow key={group.id}>
                      <TableCell>{group.name}</TableCell>
                      <TableCell>
                        <Chip
                          label={group.type}
                          size="small"
                          color={group.type === 'External' ? 'secondary' : 'primary'}
                        />
                      </TableCell>
                      <TableCell>{group.count}</TableCell>
                      <TableCell>
                        <IconButton
                          size="small"
                          onClick={() => handleOpenGroupDialog(group)}
                          title="Edit group"
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteGroup(group.id)}
                          title="Delete group"
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </TabPanel>
      </Card>

      {/* Group Dialog */}
      <Dialog open={groupDialogOpen} onClose={() => setGroupDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>{editingGroup ? 'Edit Group' : 'Add New Group'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Group Name"
              value={groupFormData.name}
              onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
              required
            />
            <TextField
              fullWidth
              label="Member Count (used if no members defined)"
              type="number"
              value={groupFormData.count}
              onChange={(e) => setGroupFormData({ ...groupFormData, count: parseInt(e.target.value) || 1 })}
              inputProps={{ min: 1 }}
              required
              helperText="This count is used when no individual members are defined below"
            />
            <FormControl fullWidth>
              <Typography variant="body2" sx={{ mb: 1 }}>Type</Typography>
              <Select
                value={groupFormData.type}
                onChange={(e) => setGroupFormData({ ...groupFormData, type: e.target.value })}
              >
                <MenuItem value="Internal">Internal</MenuItem>
                <MenuItem value="External">External</MenuItem>
              </Select>
            </FormControl>

            {editingGroup && (
              <>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    Group Members
                  </Typography>
                  <Button
                    size="small"
                    startIcon={<PersonAddIcon />}
                    onClick={() => handleOpenMemberForm()}
                  >
                    Add Member
                  </Button>
                </Box>
                
                {groupMembers.length === 0 ? (
                  <Alert severity="info">
                    No members defined. The group count ({groupFormData.count}) will be used for calculations.
                  </Alert>
                ) : (
                  <List sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}>
                    {groupMembers.map((member, index) => (
                      <Box key={member.id}>
                        {index > 0 && <Divider />}
                        <ListItem
                          secondaryAction={
                            <Box>
                              <IconButton 
                                edge="end" 
                                size="small" 
                                onClick={() => handleOpenMemberForm(member)}
                                sx={{ mr: 1 }}
                              >
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton 
                                edge="end" 
                                size="small" 
                                color="error"
                                onClick={() => handleDeleteMember(member.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Box>
                          }
                        >
                          <ListItemText
                            primary={member.name}
                            secondary={
                              <Box sx={{ display: 'flex', gap: 0.5, mt: 0.5, flexWrap: 'wrap' }}>
                                {member.excludeFromAllHeadcount && (
                                  <Chip label="Excluded from all" size="small" color="error" />
                                )}
                                {!member.excludeFromAllHeadcount && member.excludeFromInternalHeadcount && groupFormData.type === 'Internal' && (
                                  <Chip label="Excluded from internal" size="small" color="warning" />
                                )}
                                {!member.excludeFromAllHeadcount && !member.excludeFromInternalHeadcount && (
                                  <Chip label="Included in calculations" size="small" color="success" />
                                )}
                              </Box>
                            }
                          />
                        </ListItem>
                      </Box>
                    ))}
                  </List>
                )}
              </>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setGroupDialogOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveGroup}
            variant="contained"
            disabled={!groupFormData.name || groupFormData.count < 1}
          >
            {editingGroup ? 'Save Changes' : 'Add Group'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Member Dialog */}
      <Dialog open={memberFormOpen} onClose={() => setMemberFormOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{editingMember ? 'Edit Member' : 'Add Member'}</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              fullWidth
              label="Member Name"
              value={memberFormData.name}
              onChange={(e) => setMemberFormData({ ...memberFormData, name: e.target.value })}
              required
            />
            
            <Box>
              <FormLabel component="legend">Calculation Settings</FormLabel>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={memberFormData.excludeFromAllHeadcount}
                    onChange={(e) => setMemberFormData({ ...memberFormData, excludeFromAllHeadcount: e.target.checked })}
                  />
                }
                label="Exclude from all calculations (global)"
              />
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4, mb: 1 }}>
                Member will not be counted in any expense calculations
              </Typography>
              
              {!memberFormData.excludeFromAllHeadcount && groupFormData.type === 'Internal' && (
                <>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={memberFormData.excludeFromInternalHeadcount}
                        onChange={(e) => setMemberFormData({ ...memberFormData, excludeFromInternalHeadcount: e.target.checked })}
                      />
                    }
                    label="Exclude from internal family calculations only"
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', ml: 4 }}>
                    Member will still be counted in external calculations but not internal ones
                  </Typography>
                </>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setMemberFormOpen(false)}>Cancel</Button>
          <Button
            onClick={handleSaveMember}
            variant="contained"
            disabled={!memberFormData.name}
          >
            {editingMember ? 'Save Changes' : 'Add Member'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default AdminPage;
