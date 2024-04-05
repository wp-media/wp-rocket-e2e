@delayjs @setup
Feature: No Regression with delayjs script udpate

    Background:
        Given I am logged in
        And plugin is installed 'new_release'
        And plugin is activated
        And I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        And I save settings 'fileOptimization' 'delayJs'

    Scenario: Shouldn't cause console error when enabling Delay JS with theme
        When theme is activated
        And I log out
        And I visit site url
        And move the mouse
        Then no error in the console different than nowprocket page ''

    Scenario: Should the mobile menu work While Delay JS is enabled
        When theme is activated
        Then I must not see any visual regression 'delayJsMobile'

    Scenario: Should links be clickable While Delay JS is enabled
        When I save settings 'cache' 'mobileDeviceCache'
        And I save settings 'cache' 'mobileDeviceSeparateCache'
        When theme is activated
        And I log out
        And visit page '' in mobile view
        And expand mobile menu 
        And I click on link
        Then page navigated to the new page 'about-us'

    Scenario: Shouldn't cause console error when enabling Delay JS with WPML
        When I go to 'wp-admin/plugins.php'
        And activate 'wpml-multilingual-cms' plugin
        And I go to 'wp-admin/admin.php?page=sitepress-multilingual-cms/menu/languages.php'
        And wpml directory is enabled
        And I log out
        And I visit site url
        Then no error in the console different than nowprocket page 'ar'