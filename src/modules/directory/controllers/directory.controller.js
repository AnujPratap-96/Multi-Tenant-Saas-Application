import { successResponse } from "../../../utils/response.js";
import * as directoryRepository from "../repositories/directory.repository.js";

export const listDirectoryController = async (req, res) => {
  const result = await directoryRepository.listDirectory(req.tenantId, req.validated.query);
  return successResponse(res, { data: result });
};
