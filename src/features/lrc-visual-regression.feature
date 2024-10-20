@setup @lrc
Feature: LRC Visual Regression Test on Live Template

  Background:
    Given I am logged in
    And plugin is installed 'new_release'
    And plugin is activated
    And I go to 'wp-admin/options-general.php?page=wprocket#dashboard'

    Scenario: Shouldn't have any visual regression when visiting
      When I log out
      And I visit scenario urls
      And I am logged in
      And I clear cache
      Then I must not see any visual regression in scenario urls

