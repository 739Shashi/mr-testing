import express from 'express';
import {
  inviteCaregiver,
  updateCaregiverPermission,
  verifyCaregiver,
  softDeleteCaregiver,
} from '../controllers/caregiver.controller';

const caregiverRouter = express.Router();
caregiverRouter.post('/invite', inviteCaregiver);
caregiverRouter.patch('/update/:id', updateCaregiverPermission);
caregiverRouter.post('/verify', verifyCaregiver);
caregiverRouter.delete('/delete/:id', softDeleteCaregiver);
export default caregiverRouter;
