import { Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { ApiResponseDto } from '../dto/api-response.dto';

export const ApiResponse = <TModel extends Type<any>>(
    model: TModel,
    message = '操作成功',
    code = 200,
) => {
    return applyDecorators(
        ApiExtraModels(model),
        ApiOkResponse({
            schema: {
                allOf: [
                    { $ref: getSchemaPath(ApiResponseDto) },
                    {
                        properties: {
                            data: {
                                $ref: getSchemaPath(model),
                            },
                            code: {
                                type: 'number',
                                default: code,
                            },
                            message: {
                                type: 'string',
                                default: message,
                            },
                        },
                    },
                ],
            },
        }),
    );
};
