# Generated by Django 2.1 on 2018-08-27 14:55

import django.contrib.postgres.fields.jsonb
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('dashboard', '0105_auto_20180815_1751'),
    ]

    operations = [
        migrations.AddField(
            model_name='profile',
            name='funder_total_budget_usdt',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=50),
        ),
        migrations.AlterField(
            model_name='tip',
            name='emails',
            field=django.contrib.postgres.fields.jsonb.JSONField(blank=True),
        ),
        migrations.AlterField(
            model_name='tip',
            name='username',
            field=models.CharField(blank=True, default='', max_length=255),
        ),
    ]