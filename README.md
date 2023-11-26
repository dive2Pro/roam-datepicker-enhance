# Datepick Enhancer

Datepick Enhancer allows Roam's date picker to convey additional information about each date:

1. the [number of blocks](#number-of-blocks) present
1. whether the date has been [mentioned](#mentions)
1. the number of [tasks due](#tasks-due-optional)

<br>
<img alt="An enhanced date picker" src="https://user-images.githubusercontent.com/23192045/208814065-23c13f81-0796-4ff4-be74-0ef1522b89e9.png" width="300">

## Number of blocks

Each date is shaded according to how many blocks are present in its corresponding Daily Note. The more blocks present, the deeper the shade of green.

## Mentions

Draws an orange border when the date has been mentioned at least once.

## Tasks due (optional)

An adjacent number indicating the number of tasks due for the date. A block is treated as a due task when it both:

  1. is a `{{[[TODO]]}}`
  1. has a child block which both:
    1. has the attribute `due::` or the tag `#due`. (Set another page to be used in place of `due` in Datepick Enhancer's settings, or `0` to disable this functionality.)
    1. mentions a [[date]]

### Example of a due task

![Structure of a minimal due task](https://user-images.githubusercontent.com/23192045/209608158-f3166598-685d-4dd7-9a58-16cabd067db5.png)
