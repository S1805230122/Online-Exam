export interface ClazzVO {
  /**
   * 班级ID
   */
  clazzId: string | number;

  /**
   * 班级名称
   */
  clazzName: string;

  /**
   * 部门ID
   */
  deptId: string| number;

  /*
  * 用户ID
  * */
  userId: string| number;

  /*
  * 成员数量
  * */
  memberCount: number;

  /**
   * 班级描述
   */
  description: string;

  /**
   * 负责人
   */
  leader: number;

  /**
   * 备注信息
   */
  remark: string;

}

export interface ClazzForm extends BaseEntity {
  /**
   * 班级ID
   */
  clazzId?: string | number;

  /**
   * 班级名称
   */
  clazzName?: string;

  /**
   * 部门名称
   */
  deptId?: number;

  /*
  * 成员数量
  * */
  members?: number;

  /**
   * 班级描述
   */
  description?: string;

  /*
  * 创建者
  * */
  userId?: number;

  /**
   * 备注信息
   */
  remark?: string;

}

export interface ClazzQuery extends PageQuery {

  /**
   * 班级名称
   */
  clazzName?: string;

  /**
   * 部门名称
   */
  deptId?: string | number;

  /*
  * 创建者
  * */
  userId?: number;

  /**
   * 班级描述
   */
  description?: string;


  /**
   * 创建部门
   */
  createDept?: number;


  /**
   * 日期范围参数
   */
  params?: any;
}



