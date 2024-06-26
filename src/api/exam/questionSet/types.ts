export interface QuestionSetVO {
  /**
   * 题库ID
   */
  questionSetId: string ;

  /**
   * 题库名称
   */
  questionSetName: string;

  /**
   * 题库配置
   */
  bankConfig: string;

  /**
   * 共享标志
   */
  shareFlag: string;

  /**
   * 题库标签
   */
  tag: string;

  /**
   * 题型统计
   */
  questionCount: string;

  /**
   * 题库总分
   */
  totalScore: number;

  /**
   * 题库描述
   */
  description: string;

  /**
   * 备注信息
   */
  remark: string;

}

export interface QuestionSetForm extends BaseEntity {
  /**
   * 题库ID
   */
  questionSetId?: string | number;

  /**
   * 题库名称
   */
  questionSetName?: string;

  /**
   * 题库配置
   */
  bankConfig?: string;

  /**
   * 共享标志
   */
  shareFlag?: string;

  tags?: Array<string | number>;

  /**
   * 题库标签ID
   */
  tagsIds?: Array<string | number>;

  /*
  * 题库标签名称
  * */
  tagsNames?: Array<string | number>;

  tagsName?: any;

  /**
   * 题型统计
   */
  questionCount?: string;

  /**
   * 题库总分
   */
  totalScore?: number;

  /**
   * 题库描述
   */
  description?: string;

  /**
   * 备注信息
   */
  remark?: string;

}

export interface QuestionSetQuery extends PageQuery {

  /**
   * 题库名称
   */
  questionSetName?: string;

  /**
   * 题库配置
   */
  bankConfig?: string;

  /**
   * 共享标志
   */
  shareFlag?: string;

  /**
   * 题库标签ID
   */
  tagsIds?: Array<string | number>;

  /*
  * 题库标签名称
  * */
  tagsNames?: Array<string | number>;
  tagsName?: string;

  /**
   * 题型统计
   */
  questionCount?: string;

  /**
   * 题库总分
   */
  totalScore?: number;

  /**
   * 题库描述
   */
  description?: string;

  /**
   * 日期范围参数
   */
  params?: any;
}



