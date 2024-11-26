@delayjs @setup
Feature: No Regression with delayjs script udpate

    Background:
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated
        And I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        And I save settings 'fileOptimization' 'delayJs'

    Scenario Outline: Shouldn't cause console error when enabling Delay JS with theme
        Given theme "<theme>" is activated
        And visual regression reference is generated
        When I log out
        Then no error in the console different than nowprocket page ''
        Then I must not see any visual regression 'delayJsMobile'
        When I save settings 'cache' 'mobileDeviceCache'
        And I save settings 'cache' 'mobileDeviceSeparateCache'
        And I log out
        And I visit '' in mobile view
        And expand mobile menu 
        And I click on link
        Then page navigated to the new page 'about-us'
        When I log in
        And I go to 'wp-admin/plugins.php'
        And activate 'wpml-multilingual-cms' plugin
        And I go to 'wp-admin/admin.php?page=sitepress-multilingual-cms/menu/languages.php'
        And wpml directory is enabled
        And I log out
        And I visit site url
        Then no error in the console different than nowprocket page 'ar'

        Examples:
            | theme                  |
            | astra                  |
            | Divi                   |
            | flatsome               |
            | genesis-sample-develop |