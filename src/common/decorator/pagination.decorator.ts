import { Type, applyDecorators } from '@nestjs/common';
import { ApiExtraModels, ApiOkResponse, getSchemaPath } from '@nestjs/swagger';
import { PaginationDto } from '../dto/pagination.dto';
import { ApiResponseDto } from '../dto/api-response.dto';

export const ApiPaginatedResponse = <TModel extends Type<any>>(
    model: TModel,
    message = '操作成功',
    code = 200,
) => {
    return applyDecorators(
        ApiExtraModels(model, PaginationDto),
        ApiOkResponse({
            schema: {
                allOf: [
                    { $ref: getSchemaPath(ApiResponseDto) },
                    {
                        properties: {
                            data: {
                                allOf: [
                                    { $ref: getSchemaPath(PaginationDto) },
                                    {
                                        properties: {
                                            list: {
                                                type: 'array',
                                                items: {
                                                    $ref: getSchemaPath(model),
                                                },
                                            },
                                        },
                                    },
                                ],
                            },
                            message: {
                                type: 'string',
                                default: message,
                            },
                            code: {
                                type: 'number',
                                default: code,
                            },
                        },
                    },
                ],
            },
        }),
    );
};
