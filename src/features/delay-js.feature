@delayjs @setup
Feature: No Regression with delayjs script udpate

    Background:
        Given I am logged in

    Scenario: Shouldn't cause console error when enabling Delay JS with genesis theme
        Given plugin is installed 'new_release'
        And plugin is activated
        And I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        And I save settings 'fileOptimization' 'delayJs'
        When theme is activated
        And I log out
        And I visit site url
        And move the mouse
        Then no error in the console different than nowprocket page ''

    Scenario: Should the mobile menu work While Delay JS is enabled
        Given plugin is installed 'new_release'
        And plugin is activated
        And I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        And I save settings 'fileOptimization' 'delayJs'
        When theme is activated
        Then I must not see any visual regression 'delayJsMobile'

    Scenario: Should links be clickable While Delay JS is enabled
         Given plugin is installed 'new_release'
        And plugin is activated
        And I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        And I save settings 'fileOptimization' 'delayJs'
        And I save settings 'cache' 'mobileDeviceCache'
        And I save settings 'cache' 'mobileDeviceSeparateCache'
        When theme is activated
        And I log out
        And visit page '' in mobile view
        And expand mobile menu 
        And I click on 'a[href="https://e2e.rocketlabsqa.ovh/about-us/"]'
        Then page navigated to the new page 'https://e2e.rocketlabsqa.ovh/about-us'

    Scenario: Shouldn't cause console error when enabling Delay JS with WPML
        Given plugin is installed 'new_release'
        And plugin is activated
        And I go to 'wp-admin/plugins.php'
        And plugin is activated 'wpml-multilingual-cms'
        And I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        When I save settings 'fileOptimization' 'delayJs'
        And I log out
        And I visit site url
        And switch language
        Then no error in the console different than nowprocket page 'ar'