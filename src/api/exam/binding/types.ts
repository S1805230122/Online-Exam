export interface BindingVO {
        /**
         * 账号绑定ID
         */
            bindingId: string | number;

        /**
         * 账号绑定
         */
            binding: string;

        /**
         * 用户ID
         */
            userId: string | number;

        /**
         * 班级ID
         */
            clazzId: string | number;

        /**
         * 账号绑定类型 默认0学号 1工号
         */
            bindingType: string;

        /**
         * 部门ID
         */
            deptId: string | number;

        /**
         * 姓名
         */
            name: string;

        /**
         * 备注信息
         */
            remark: string;

}

export interface BindingForm extends BaseEntity {
        /**
         * 账号绑定ID
         */
            bindingId?: string | number;

        /**
         * 账号绑定
         */
            binding?: string;

        /**
         * 用户ID
         */
            userId?: string | number;

        /**
         * 班级ID
         */
            clazzId?: string | number;

        /**
         * 账号绑定类型 默认0学号 1工号
         */
            bindingType?: string;

        /**
         * 部门ID
         */
            deptId?: string | number;

        /**
         * 姓名
         */
            name?: string;

        /**
         * 备注信息
         */
            remark?: string;

}

export interface BindingQuery extends PageQuery {

        /**
         * 账号绑定
         */
            binding?: string;

        /**
         * 用户ID
         */
            userId?: string | number;

        /**
         * 班级ID
         */
            clazzId?: string | number;

        /**
         * 账号绑定类型 默认0学号 1工号
         */
            bindingType?: string;

        /**
         * 部门ID
         */
            deptId?: string | number;

        /**
         * 姓名
         */
            name?: string;

    /**
     * 日期范围参数
     */
    params?: any;
}



