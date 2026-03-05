export interface BackendValidationError {
  type: string;
  loc: string[];
  msg: string;
  input?: unknown;
  ctx?: Record<string, any>;
}

export interface BackendErrorResponse {
  detail?: BackendValidationError[];
}

export interface ParsedError {
  field?: string;
  message: string;
  type?: string;
}

export class ApiErrorParser {
  static parse(error: unknown): ParsedError[] {
    if (!error || typeof error !== "object") {
      return [{ message: "Unknown error" }];
    }

    const err = error as BackendErrorResponse;
    console.log(err);
    if (!err.detail || !Array.isArray(err.detail)) {
      return [{ message: "Unexpected server error" }];
    }

    return err.detail.map((item) => {
      const field = item.loc?.[1]; // body.assigned_to → lấy assigned_to

      return {
        field,
        message: item.msg,
        type: item.type,
      };
    });
  }

  //   private static humanizeMessage(error: BackendValidationError): string {
  //     switch (error.type) {
  //       case "uuid_parsing":
  //         return "Giá trị phải là UUID hợp lệ";

  //       case "missing":
  //         return "Trường này là bắt buộc";

  //       default:
  //         return error.msg;
  //     }
  //   }

  static toFieldMap(errors: ParsedError[]) {
    const map: Record<string, string> = {};

    for (const err of errors) {
      if (err.field) {
        map[err.field] = err.message;
      }
    }

    return map;
  }
}
