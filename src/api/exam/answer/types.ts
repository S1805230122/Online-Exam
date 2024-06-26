export interface AnswerVO {
  /**
   *
   */
  id: string | number;
  index: number;

  /**
   * 试卷ID
   */
  paperId: string | number;

  /**
   * 用户ID
   */
  userId: string | number;

  /*答卷数量*/
  answerCount: number;
  /**
   * 试卷内容
   */
  paperContent: string;

  /**
   * 暂存答案
   */
  tempAnswer: string;

  /**
   * 答案
   */
  answer: string;

  /**
   * 试卷数据
   */
  metaInfo: string;

  /**
   * 0暂存 1已完成
   */
  tempSave: string;

  /**
   * 考试信息
   */
  examInfo: string;
  examInfoMap: any;
  /**
   * 考试练习类型
   */
  examExerciseType: string;

  /**
   * 考试分数
   */
  examScore: number;

  /**
   * 备注信息
   */
  remark: string;

}

export interface AnswerForm extends BaseEntity {
  /**
   *
   */
  id?: string | number;

  /**
   * 试卷ID
   */
  paperId?: string | number;

  /**
   * 用户ID
   */
  userId?: string | number;

  /*答卷数量*/
  answerCount?:number;
  /**
   * 试卷内容
   */
  paperContent?: string;

  /**
   * 暂存答案
   */
  tempAnswer?: string;

  /**
   * 答案
   */
  answer?: string;

  /**
   * 试卷数据
   */
  metaInfo?: string;

  /**
   * 0暂存 1已完成
   */
  tempSave?: string;

  /**
   * 考试信息
   */
  examInfo?: string;

  /**
   * 考试练习类型
   */
  examExerciseType?: string;

  /**
   * 考试分数
   */
  examScore?: number;

  /**
   * 备注信息
   */
  remark?: string;

}

export interface AnswerQuery extends PageQuery {

  /**
   * 试卷ID
   */
  paperId?: string | number;

  /**
   * 用户ID
   */
  userId?: string | number;

  /**
   * 试卷内容
   */
  paperContent?: string;

  /**
   * 暂存答案
   */
  tempAnswer?: string;

  /**
   * 答案
   */
  answer?: string;

  /**
   * 试卷数据
   */
  metaInfo?: string;

  /**
   * 0暂存 1已完成
   */
  tempSave?: string;

  /**
   * 考试信息
   */
  examInfo?: string;

  /**
   * 考试练习类型
   */
  examExerciseType?: string;

  /**
   * 考试分数
   */
  examScore?: number;

  /**
   * 日期范围参数
   */
  params?: any;
}



