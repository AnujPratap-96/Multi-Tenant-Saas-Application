import { Router } from "express";
import { validate } from "../../../middlewares/validate.middleware.js";
import { requireAccessToken } from "../../../middlewares/auth.middleware.js";
import { resolveTenant, requireTenant } from "../../tenant/middleware/tenant.middleware.js";
import {
  createDepartmentSchema,
  updateDepartmentSchema,
  addDepartmentMemberSchema,
  removeDepartmentMemberSchema,
  listDepartmentMembersQuerySchema,
  listDepartmentsQuerySchema,
  departmentIdParamSchema,
  createTaskTypeSchema,
  updateTaskTypeSchema,
  taskTypeIdParamSchema,
} from "../schemas/department.schema.js";
import * as departmentController from "../controllers/department.controller.js";

const router = Router();

// All routes require auth + tenant context, and validate+transform via `validate` before the controller.
router.use(requireAccessToken);
router.use(resolveTenant);
router.use(requireTenant);

// Departments
router.post("/", validate(createDepartmentSchema), departmentController.createDepartmentController);
router.get("/", validate(listDepartmentsQuerySchema), departmentController.listDepartmentsController);
router.get("/:id", validate(departmentIdParamSchema), departmentController.getDepartmentController);
router.patch("/:id", validate(updateDepartmentSchema), departmentController.updateDepartmentController);
router.delete("/:id", validate(departmentIdParamSchema), departmentController.deleteDepartmentController);

// Department members
router.post("/:id/members", validate(addDepartmentMemberSchema), departmentController.addMemberController);
router.get("/:id/members", validate(listDepartmentMembersQuerySchema), departmentController.listMembersController);
router.delete("/:id/members/:userId", validate(removeDepartmentMemberSchema), departmentController.removeMemberController);

// Task types
router.post("/task-types", validate(createTaskTypeSchema), departmentController.createTaskTypeController);
router.get("/task-types", departmentController.listTaskTypesController);
router.patch("/task-types/:id", validate(updateTaskTypeSchema), departmentController.updateTaskTypeController);
router.delete("/task-types/:id", validate(taskTypeIdParamSchema), departmentController.deleteTaskTypeController);

export default router;
