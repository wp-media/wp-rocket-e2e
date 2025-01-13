@vr @setup
Feature: Visual Regression Test

    Scenario: Test any page for visual regression
        Given visual regression reference is generated
        And I am logged in
        And plugin is installed 'new_release'
        And plugin is activated
        And I go to 'wp-admin/options-general.php?page=wprocket#dashboard'
        When I enable option
        Then I must not see any visual regression in scenario urls