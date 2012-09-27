/*
 * ParameterQuestionVO.java
 */
package com.itk.browsersolution.vo;

/**
 * This class represents a parameter question and related answer.
 *
 * @author Samuel Haddad
 * @since 26/09/2012
 * @version 2.4
 * 
 */
public class ParameterQuestionVO {
    
    private String parameterId;
    private String questionDescription;
    private String questionAnswer;


    /**
     * Class ParameterQuestionVO
     * Gets the parameter identifier.
     * The parameter identifier is used in the adapter to be replace to 
     * the questionAnswer.
     * 
     * @return Returns the parameter identifier.
     */
    public String getParameterId() {
        return parameterId;
    }

    /**
     * Sets the parameter identifier.
     * The parameter identifier is used in the adapter to be replace to 
     * the questionAnswer.
     * 
     * @param parameterId Parameter Identifier.
     */    
    public void setParameterId(String parameterId) {
        this.parameterId = parameterId;
    }

    /**
     * Gets the question description.
     * A question will be made to the user in order to get a value for 
     * the parameter.
     * 
     * @return Returns the question description.
     */
    public String getQuestionDescription() {
        return questionDescription;
    }

    
    /**
     * Sets the question description.
     * A question will be made to the user in order to get a value for 
     * the parameter.
     * 
     * @param questionDescription Question to get a user answer.
     */    
    public void setQuestionDescription(String questionDescription) {
        this.questionDescription = questionDescription;
    }


    /**
     * Gets the question answer.
     * The user will provide an answer according to the question description.
     * 
     * @return Returns the question answer.
     */    
    public String getQuestionAnswer() {
        return questionAnswer;
    }

    
    /**
     * Sets the question answer.
     * The user will provide an answer according to the question description.
     * 
     * @questionAnswer Question answer.
     */        
    public void setQuestionAnswer(String questionAnswer) {
        this.questionAnswer = questionAnswer;
    }
    
    
}
