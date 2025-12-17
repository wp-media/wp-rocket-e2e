@delayjs @setup 
Feature: No Regression with delayjs script udpate

    Background:
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated
        

    Scenario Outline: Shouldn't cause console error when enabling Delay JS with theme
        Given theme "<theme>" is activated
        And I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        And I save settings 'fileOptimization' 'delayJs'
        And one click exclusions are enabled
        When I log out
        Then no error in the console different than nowprocket page ''
        And I visit '' in mobile view
        And expand mobile menu and validate no console error
        And I click on link
        Then page navigated to the new page 'about-us'

        Examples:
            | theme                  |
            | Divi                   |
            | astra                  |
            | flatsome               |
            | storefront             |
            | hello-elementor        |
            | neve                   |
            | kadence                |
            | generatepress          |
            | genesis-sample         |
            | Avada                  |
            | oceanwp                |
  
    
    