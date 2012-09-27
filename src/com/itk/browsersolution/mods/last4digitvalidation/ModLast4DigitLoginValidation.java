/*
 * ModLast4DigitLoginValidation.java
 */
package com.itk.browsersolution.mods.last4digitvalidation;

import com.itk.browsersolution.mods.BaseMods;
import com.itk.browsersolution.vo.ParameterQuestionVO;
import java.util.Arrays;
import java.util.LinkedList;
import java.util.List;
import java.util.Map;


/**
 * Mods for Last 4 Digit Login Validation.
 *
 * @author Samuel Haddad
 * @since 26/09/2012
 * @version 2.4
 */
public class ModLast4DigitLoginValidation extends BaseMods{
    
    
    
    /**
     * Gets the ModLast4DigitLoginValidation identifier.
     * 
     * @return Returns ModLast4DigitLoginValidation identifier.
     */
    @Override
    public String getDescription()
    {
        return "Implements Login Validations for the last 4 (four) digits of the User Name in the Login.html file.";
    }
    
    
    
    /**
     * Gets the ModLast4DigitLoginValidation identifier.
     * 
     * @return Returns ModLast4DigitLoginValidation identifier.
     */
    @Override
    public String getId()
    {
        return "MODL4DL";
    }
    
    /**
     * Gets the ModLast4DigitLoginValidation supported versions of Lawson.
     * 
     * @return Returns ModLast4DigitLoginValidation supported versions of Lawson.
     */
    @Override
    public List<String> getSupportedVersions()
    {
        
        return new LinkedList<String>(Arrays.asList(new String[]{"9.0.1.7", "9.0.1.8", "9.0.1.9", "9.0.1.10"}));
    }
    
    
    
    /**
     * Constructor
     * 
     */
    public ModLast4DigitLoginValidation()
    {
       super();
       Map<String, ParameterQuestionVO> questions = this.getParameterQuestions();
       ParameterQuestionVO question1 = new ParameterQuestionVO();
       question1.setParameterId("#$$$hostname$$$#");
       question1.setQuestionDescription("What´s the external host name to validate last 4 digits?");
       question1.setQuestionAnswer("esslawsontest.iasishealthcare.com");
       
       questions.put(this.getId(), question1);
       //TODO - Questions and replace in the basemods implementations.
       //TODO - After, questions in the main class.
       
       
       this.add(new com.itk.browsersolution.mods.last4digitvalidation.html.LoginAdapter());
       this.add(new com.itk.browsersolution.mods.last4digitvalidation.js.LoginAdapter());
    }
}
