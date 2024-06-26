export interface PaperVO {
  /**
   * 试卷ID
   */
  paperId: string | number;

  /**
   * 课程ID
   */
  courseId: string | number;

  /**
   * 班级ID
   */
  clazzId: string | number;

  /**
   * 试卷名称
   */
  paperName: string;

  /**
   * 试卷类型
   */
  paperMode: string;

  /**
   * 试卷内容
   */
  paperContentObj: any;

  /**
   * 状态
   */
  status: string;

  /**
   * 试卷配置
   */
  paperSettingObj: any;

  /**
   * 备注信息
   */
  remark: string;

}

export interface PaperForm extends BaseEntity {
  /**
   * 试卷ID
   */
  paperId?: string | number;

  /**
   * 课程ID
   */
  courseId?: string | number;
  clazzId?: string | number;
  /**
   * 班级ID
   */
  clazzIdList?: any;

  /**
   * 试卷名称
   */
  paperName?: string;

  /**
   * 试卷类型
   */
  paperMode?: string;

  /**
   * 试卷内容
   */
  paperContentObj?: any;

  /**
   * 状态
   */
  status?: string;

  /**
   * 试卷配置
   */
  paperSettingObj?: any;

  /**
   * 备注信息
   */
  remark?: string;

}

export interface PaperQuery extends PageQuery {

  /**
   * 课程ID
   */
  courseId?: string | number;

  /**
   * 班级ID
   */
  clazzId?: any;

  /**
   * 试卷名称
   */
  paperName?: string;

  /**
   * 试卷类型
   */
  paperMode?: string;

  /**
   * 试卷内容
   */
  paperContentObj?: string;

  /**
   * 状态
   */
  status?: string;

  /**
   * 试卷配置
   */
  paperSettingObj?: string;

  /**
   * 日期范围参数
   */
  params?: any;
}

export interface paperQuestionSetVo {
  id?: number | string,
  questionSetId?: number | string,
  questionTypes?: Array<string>|null,
  tags?: Array<string>|null,
  questionCount?:Array<any>,
  questionTagCount?:Array<any>
  questionNum?: number|null,
  score?: number|null
}
export interface PaperQuestionForm{
  id?:number|string,
  title?:string,
  description?:string,
  type?:string,
  attribute?:any,
  children?:Array<any>|any,
}


