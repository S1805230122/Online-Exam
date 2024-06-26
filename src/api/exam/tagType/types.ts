export interface TagTypeVO {
        /**
         * 标签ID
         */
            tagId: string | number;

        /**
         * 标签类型
         */
            tagType: string;

        /**
         * 标签名称
         */
            tagName: string;

}

export interface TagTypeForm extends BaseEntity {
        /**
         * 标签ID
         */
            tagId?: string | number;

        /**
         * 标签类型
         */
            tagType?: string;

        /**
         * 标签名称
         */
            tagName?: string;

}

export interface TagTypeQuery extends PageQuery {

        /**
         * 标签类型
         */
            tagType?: string;

        /**
         * 标签名称
         */
            tagName?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



