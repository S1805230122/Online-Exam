export interface TagDataVO {
        /**
         * 数据关联ID
         */
            id: string | number;

        /**
         * 标签ID
         */
            tagId: string | number;

}

export interface TagDataForm extends BaseEntity {
        /**
         * 数据关联ID
         */
            id?: string | number;

        /**
         * 标签ID
         */
            tagId?: string | number;

}

export interface TagDataQuery extends PageQuery {

    /**
     * 日期范围参数
     */
    params?: any;
}



