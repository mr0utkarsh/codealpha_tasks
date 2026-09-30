import { Router } from 'express';
import { addComment, listComments } from '../controllers/comment.controller.js';
import { deleteTask, getTask, updateTask } from '../controllers/task.controller.js';
import { validate } from '../middleware/validate.js';
import { createCommentSchema } from '../validators/comment.schema.js';
import { updateTaskSchema } from '../validators/task.schema.js';

const router = Router();

router.get('/:id', getTask);
router.put('/:id', validate(updateTaskSchema), updateTask);
router.delete('/:id', deleteTask);

// Comments nested under a task
router.get('/:id/comments', listComments);
router.post('/:id/comments', validate(createCommentSchema), addComment);

export default router;
