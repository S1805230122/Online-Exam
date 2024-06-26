export interface QuestionVO {
  /**
   * 题目ID
   */
  questionId: string | number;

  /**
   * 题库ID
   */
  questionSetId: string | number;

  /**
   * 题目类型
   */
  questionType: string;

  /**
   * 作者
   */
  author: string;

  /**
   * 题目标签
   */
  tag: string;

  /**
   * 难易程度
   */
  difficulty: number;
  difficultyName?: string;

  /**
   * 显示顺序
   */
  orderNum: number;

  /**
   * 题目
   */
  content: string;

  /**
   * 题目模板
   */
  template: string;
  templateObj: any;

  /**
   * 答案
   */
  answer: string;

  /**
   * 分值
   */
  score: number;

  /**
   * 备注信息
   */
  remark: string;

}

export interface QuestionForm extends BaseEntity {
  /**
   * 题目ID
   */
  questionId?: string | number;

  /**
   * 题库ID
   */
  questionSetId?: string | number;

  /**
   * 题目类型
   */
  questionType?: string;

  /**
   * 作者
   */
  author?: string;

  /**
   * 题目标签
   */
  tagsIds?: Array<string | number>;

  /**
   * 难易程度
   */
  difficulty?: number;
  difficultyName?: string;

  /**
   * 显示顺序
   */
  orderNum?: number;

  /**
   * 题目
   */
  content?: string;

  /**
   * 题目模板
   */
  template: string;
  templateObj: any;

  /**
   * 答案
   */
  answer?: string;

  /**
   * 分值
   */
  score?: number;

  /**
   * 备注信息
   */
  remark?: string;

}

export interface QuestionUpdateForm {
  /*题库ID*/
  questionSetId: string | number;
  /*题目列表*/
  templates: Array<QuestionForm>;
}

export interface QuestionQuery extends PageQuery {

  /**
   * 题库ID
   */
  questionSetId?: string | number;

  /**
   * 题目类型
   */
  questionType?: string;

  /**
   * 作者
   */
  author?: string;

  /**
   * 题目标签
   */
  tagsIds?: Array<string | number>;

  /**
   * 难易程度
   */
  difficulty?: number;
  difficultyName?: string;

  /**
   * 显示顺序
   */
  orderNum?: number;

  /**
   * 题目
   */
  content?: string;

  /**
   * 题目选项
   */
  choices?: string;

  /**
   * 答案
   */
  answer?: string;

  /**
   * 分值
   */
  score?: number;

  /**
   * 日期范围参数
   */
  params?: any;
}



